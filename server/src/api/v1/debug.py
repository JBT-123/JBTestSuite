"""
Debug endpoints for troubleshooting data consistency issues
These endpoints help identify cache/session issues during development
"""

from typing import List
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from sqlalchemy.orm import selectinload

from src.core.database import get_async_session
from src.models.test_definition import TestCase

router = APIRouter(prefix="/debug", tags=["debug"])


@router.get("/test-cases/raw")
async def get_raw_test_cases(session: AsyncSession = Depends(get_async_session)):
    """Get raw test cases directly from database with minimal processing"""
    result = await session.execute(
        select(TestCase)
        .options(selectinload(TestCase.steps))
        .order_by(TestCase.created_at.desc())
    )
    test_cases = result.scalars().all()
    
    return {
        "count": len(test_cases),
        "test_cases": [
            {
                "id": str(tc.id),
                "name": tc.name,
                "status": tc.status.value if tc.status else None,
                "priority": tc.priority.value if tc.priority else None,
                "step_count": len(tc.steps) if tc.steps else 0,
                "created_at": tc.created_at.isoformat() if tc.created_at else None,
                "updated_at": tc.updated_at.isoformat() if tc.updated_at else None,
            }
            for tc in test_cases
        ],
        "query_time": datetime.now().isoformat()
    }


@router.get("/test-cases/session-info")
async def get_session_info(session: AsyncSession = Depends(get_async_session)):
    """Get information about the current database session"""
    
    # Get connection info
    connection_info = str(session.bind)
    
    # Check if session is dirty (has uncommitted changes)
    is_dirty = session.dirty
    is_new = session.new
    is_deleted = session.deleted
    
    # Get session identity map size (number of objects in session)
    identity_map_size = len(session.identity_map)
    
    return {
        "connection_info": connection_info,
        "session_state": {
            "is_dirty": bool(is_dirty),
            "is_new": bool(is_new), 
            "is_deleted": bool(is_deleted),
            "dirty_objects_count": len(is_dirty),
            "new_objects_count": len(is_new),
            "deleted_objects_count": len(is_deleted),
            "identity_map_size": identity_map_size
        },
        "timestamp": datetime.now().isoformat()
    }


@router.get("/test-cases/{test_id}/detailed")
async def get_test_case_detailed(
    test_id: UUID, 
    session: AsyncSession = Depends(get_async_session)
):
    """Get detailed information about a specific test case including session state"""
    
    # Multiple query strategies to compare results
    
    # Query 1: Basic query
    result1 = await session.execute(
        select(TestCase).where(TestCase.id == test_id)
    )
    test_case_basic = result1.scalar_one_or_none()
    
    # Query 2: With selectinload
    result2 = await session.execute(
        select(TestCase)
        .options(selectinload(TestCase.steps))
        .where(TestCase.id == test_id)
    )
    test_case_with_steps = result2.scalar_one_or_none()
    
    # Query 3: Fresh session query (force refresh)
    await session.commit()  # Commit any pending changes
    if test_case_basic:
        await session.refresh(test_case_basic)
    
    # Build response
    response = {
        "test_id": str(test_id),
        "query_results": {
            "basic_query": {
                "found": test_case_basic is not None,
                "name": test_case_basic.name if test_case_basic else None,
                "status": test_case_basic.status.value if test_case_basic and test_case_basic.status else None,
                "updated_at": test_case_basic.updated_at.isoformat() if test_case_basic and test_case_basic.updated_at else None
            },
            "with_steps_query": {
                "found": test_case_with_steps is not None,
                "name": test_case_with_steps.name if test_case_with_steps else None,
                "step_count": len(test_case_with_steps.steps) if test_case_with_steps and test_case_with_steps.steps else 0,
                "steps_loaded": test_case_with_steps.steps is not None if test_case_with_steps else False
            }
        },
        "session_info": {
            "object_in_session": test_case_basic in session if test_case_basic else False,
            "object_state": {
                "is_pending": test_case_basic in session.new if test_case_basic else False,
                "is_dirty": test_case_basic in session.dirty if test_case_basic else False,
                "is_deleted": test_case_basic in session.deleted if test_case_basic else False,
            } if test_case_basic else None
        },
        "timestamp": datetime.now().isoformat()
    }
    
    return response


@router.post("/test-cases/force-refresh")
async def force_refresh_test_cases(session: AsyncSession = Depends(get_async_session)):
    """Force refresh all test cases in the session"""
    
    # Get all test cases
    result = await session.execute(select(TestCase))
    test_cases = result.scalars().all()
    
    refresh_count = 0
    for test_case in test_cases:
        try:
            await session.refresh(test_case)
            refresh_count += 1
        except Exception as e:
            print(f"Failed to refresh test case {test_case.id}: {e}")
    
    return {
        "total_test_cases": len(test_cases),
        "refreshed_count": refresh_count,
        "timestamp": datetime.now().isoformat()
    }


@router.get("/database/test-connection")
async def test_database_connection(session: AsyncSession = Depends(get_async_session)):
    """Test database connection and run basic queries"""
    
    try:
        # Test basic connection
        await session.execute(text("SELECT 1"))
        
        # Test test_cases table exists
        table_check = await session.execute(
            text("SELECT COUNT(*) FROM test_cases")
        )
        test_case_count = table_check.scalar()
        
        # Test recent activity
        recent_query = await session.execute(
            text("""
                SELECT COUNT(*) as recent_count 
                FROM test_cases 
                WHERE updated_at > NOW() - INTERVAL '1 hour'
            """)
        )
        recent_count = recent_query.scalar() or 0
        
        return {
            "connection_status": "healthy",
            "test_case_count": test_case_count,
            "recent_updates_count": recent_count,
            "database_time": (await session.execute(text("SELECT NOW()"))).scalar().isoformat(),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        return {
            "connection_status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }