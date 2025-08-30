from typing import List, Optional
from uuid import UUID
import os

from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc, asc

from src.core.database import get_async_session
from src.models.artifacts import Screenshot, LogEntry, TestReport
from src.api.schemas import (
    ScreenshotCreate,
    ScreenshotResponse,
    LogEntryCreate,
    LogEntryResponse,
    TestReportResponse,
    PaginatedResponse,
    FilterParams,
    PaginationParams,
    SortParams,
)

router = APIRouter(prefix="/artifacts", tags=["artifacts"])

ARTIFACTS_DIR = "/app/artifacts"


# Screenshot endpoints
@router.get("/screenshots", response_model=PaginatedResponse[ScreenshotResponse])
async def get_screenshots(
    execution_id: Optional[UUID] = Query(None, description="Filter by test execution ID"),
    step_execution_id: Optional[UUID] = Query(None, description="Filter by test step execution ID"),
    screenshot_type: Optional[str] = Query(None, description="Filter by screenshot type"),
    pagination: PaginationParams = Depends(),
    sort: SortParams = Depends(),
    session: AsyncSession = Depends(get_async_session)
):
    query = select(Screenshot)
    
    # Apply filters
    if execution_id:
        query = query.where(Screenshot.test_execution_id == execution_id)
    if step_execution_id:
        query = query.where(Screenshot.test_step_execution_id == step_execution_id)
    if screenshot_type:
        query = query.where(Screenshot.screenshot_type == screenshot_type)
    
    # Apply sorting
    sort_field = getattr(Screenshot, sort.sort_by, Screenshot.created_at)
    if sort.order == "asc":
        query = query.order_by(asc(sort_field))
    else:
        query = query.order_by(desc(sort_field))
    
    # Count total items
    count_query = select(func.count()).select_from(Screenshot)
    if execution_id:
        count_query = count_query.where(Screenshot.test_execution_id == execution_id)
    if step_execution_id:
        count_query = count_query.where(Screenshot.test_step_execution_id == step_execution_id)
    if screenshot_type:
        count_query = count_query.where(Screenshot.screenshot_type == screenshot_type)
    
    total_result = await session.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    offset = (pagination.page - 1) * pagination.limit
    query = query.offset(offset).limit(pagination.limit)
    
    result = await session.execute(query)
    screenshots = result.scalars().all()
    
    pages = (total + pagination.limit - 1) // pagination.limit
    
    return PaginatedResponse(
        items=screenshots,
        total=total,
        page=pagination.page,
        limit=pagination.limit,
        pages=pages
    )


@router.post("/screenshots", response_model=ScreenshotResponse, status_code=status.HTTP_201_CREATED)
async def create_screenshot(
    screenshot_data: ScreenshotCreate,
    session: AsyncSession = Depends(get_async_session)
):
    screenshot = Screenshot(**screenshot_data.model_dump())
    session.add(screenshot)
    await session.commit()
    await session.refresh(screenshot)
    return screenshot


@router.get("/screenshots/{screenshot_id}", response_model=ScreenshotResponse)
async def get_screenshot(
    screenshot_id: UUID,
    session: AsyncSession = Depends(get_async_session)
):
    result = await session.execute(select(Screenshot).where(Screenshot.id == screenshot_id))
    screenshot = result.scalar_one_or_none()
    
    if not screenshot:
        raise HTTPException(status_code=404, detail="Screenshot not found")
    
    return screenshot


@router.get("/screenshots/{screenshot_id}/download")
async def download_screenshot(
    screenshot_id: UUID,
    session: AsyncSession = Depends(get_async_session)
):
    result = await session.execute(select(Screenshot).where(Screenshot.id == screenshot_id))
    screenshot = result.scalar_one_or_none()
    
    if not screenshot:
        raise HTTPException(status_code=404, detail="Screenshot not found")
    
    if not os.path.exists(screenshot.file_path):
        raise HTTPException(status_code=404, detail="Screenshot file not found")
    
    return FileResponse(
        path=screenshot.file_path,
        filename=screenshot.filename,
        media_type="image/png"
    )


@router.post("/screenshots/upload")
async def upload_screenshot(
    file: UploadFile = File(...),
    execution_id: Optional[UUID] = None,
    step_execution_id: Optional[UUID] = None,
    screenshot_type: str = "manual",
    description: Optional[str] = None,
    session: AsyncSession = Depends(get_async_session)
):
    # Ensure artifacts directory exists
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    
    # Create unique filename
    file_extension = os.path.splitext(file.filename or "screenshot.png")[1]
    unique_filename = f"{UUID.uuid4()}{file_extension}"
    file_path = os.path.join(ARTIFACTS_DIR, unique_filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # Create screenshot record
    screenshot_data = {
        "test_execution_id": execution_id,
        "test_step_execution_id": step_execution_id,
        "filename": file.filename or unique_filename,
        "file_path": file_path,
        "file_size_bytes": len(content),
        "screenshot_type": screenshot_type,
        "description": description,
    }
    
    screenshot = Screenshot(**screenshot_data)
    session.add(screenshot)
    await session.commit()
    await session.refresh(screenshot)
    
    return screenshot


@router.delete("/screenshots/{screenshot_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_screenshot(
    screenshot_id: UUID,
    delete_file: bool = Query(True, description="Also delete the physical file"),
    session: AsyncSession = Depends(get_async_session)
):
    result = await session.execute(select(Screenshot).where(Screenshot.id == screenshot_id))
    screenshot = result.scalar_one_or_none()
    
    if not screenshot:
        raise HTTPException(status_code=404, detail="Screenshot not found")
    
    # Delete physical file if requested
    if delete_file and os.path.exists(screenshot.file_path):
        try:
            os.remove(screenshot.file_path)
        except OSError:
            pass  # File might be already deleted or inaccessible
    
    await session.delete(screenshot)
    await session.commit()


# Log Entry endpoints
@router.get("/logs", response_model=PaginatedResponse[LogEntryResponse])
async def get_log_entries(
    execution_id: Optional[UUID] = Query(None, description="Filter by test execution ID"),
    level: Optional[str] = Query(None, description="Filter by log level"),
    source: Optional[str] = Query(None, description="Filter by log source"),
    pagination: PaginationParams = Depends(),
    sort: SortParams = Depends(),
    session: AsyncSession = Depends(get_async_session)
):
    query = select(LogEntry)
    
    # Apply filters
    if execution_id:
        query = query.where(LogEntry.test_execution_id == execution_id)
    if level:
        query = query.where(LogEntry.level == level)
    if source:
        query = query.where(LogEntry.source == source)
    
    # Apply sorting (default to timestamp for logs)
    if sort.sort_by == "created_at":
        sort_field = LogEntry.timestamp
    else:
        sort_field = getattr(LogEntry, sort.sort_by, LogEntry.timestamp)
    
    if sort.order == "asc":
        query = query.order_by(asc(sort_field))
    else:
        query = query.order_by(desc(sort_field))
    
    # Count total items
    count_query = select(func.count()).select_from(LogEntry)
    if execution_id:
        count_query = count_query.where(LogEntry.test_execution_id == execution_id)
    if level:
        count_query = count_query.where(LogEntry.level == level)
    if source:
        count_query = count_query.where(LogEntry.source == source)
    
    total_result = await session.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    offset = (pagination.page - 1) * pagination.limit
    query = query.offset(offset).limit(pagination.limit)
    
    result = await session.execute(query)
    log_entries = result.scalars().all()
    
    pages = (total + pagination.limit - 1) // pagination.limit
    
    return PaginatedResponse(
        items=log_entries,
        total=total,
        page=pagination.page,
        limit=pagination.limit,
        pages=pages
    )


@router.post("/logs", response_model=LogEntryResponse, status_code=status.HTTP_201_CREATED)
async def create_log_entry(
    log_data: LogEntryCreate,
    session: AsyncSession = Depends(get_async_session)
):
    log_entry = LogEntry(**log_data.model_dump())
    session.add(log_entry)
    await session.commit()
    await session.refresh(log_entry)
    return log_entry


@router.get("/logs/{log_id}", response_model=LogEntryResponse)
async def get_log_entry(
    log_id: UUID,
    session: AsyncSession = Depends(get_async_session)
):
    result = await session.execute(select(LogEntry).where(LogEntry.id == log_id))
    log_entry = result.scalar_one_or_none()
    
    if not log_entry:
        raise HTTPException(status_code=404, detail="Log entry not found")
    
    return log_entry


# Test Report endpoints
@router.get("/reports", response_model=PaginatedResponse[TestReportResponse])
async def get_test_reports(
    run_id: Optional[UUID] = Query(None, description="Filter by test run ID"),
    report_type: Optional[str] = Query(None, description="Filter by report type"),
    format_type: Optional[str] = Query(None, description="Filter by format type"),
    pagination: PaginationParams = Depends(),
    sort: SortParams = Depends(),
    session: AsyncSession = Depends(get_async_session)
):
    query = select(TestReport)
    
    # Apply filters
    if run_id:
        query = query.where(TestReport.test_run_id == run_id)
    if report_type:
        query = query.where(TestReport.report_type == report_type)
    if format_type:
        query = query.where(TestReport.format_type == format_type)
    
    # Apply sorting
    sort_field = getattr(TestReport, sort.sort_by, TestReport.created_at)
    if sort.order == "asc":
        query = query.order_by(asc(sort_field))
    else:
        query = query.order_by(desc(sort_field))
    
    # Count total items
    count_query = select(func.count()).select_from(TestReport)
    if run_id:
        count_query = count_query.where(TestReport.test_run_id == run_id)
    if report_type:
        count_query = count_query.where(TestReport.report_type == report_type)
    if format_type:
        count_query = count_query.where(TestReport.format_type == format_type)
    
    total_result = await session.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    offset = (pagination.page - 1) * pagination.limit
    query = query.offset(offset).limit(pagination.limit)
    
    result = await session.execute(query)
    reports = result.scalars().all()
    
    pages = (total + pagination.limit - 1) // pagination.limit
    
    return PaginatedResponse(
        items=reports,
        total=total,
        page=pagination.page,
        limit=pagination.limit,
        pages=pages
    )


@router.get("/reports/{report_id}", response_model=TestReportResponse)
async def get_test_report(
    report_id: UUID,
    session: AsyncSession = Depends(get_async_session)
):
    result = await session.execute(select(TestReport).where(TestReport.id == report_id))
    report = result.scalar_one_or_none()
    
    if not report:
        raise HTTPException(status_code=404, detail="Test report not found")
    
    return report


@router.get("/reports/{report_id}/download")
async def download_test_report(
    report_id: UUID,
    session: AsyncSession = Depends(get_async_session)
):
    result = await session.execute(select(TestReport).where(TestReport.id == report_id))
    report = result.scalar_one_or_none()
    
    if not report:
        raise HTTPException(status_code=404, detail="Test report not found")
    
    if not report.file_path or not os.path.exists(report.file_path):
        raise HTTPException(status_code=404, detail="Report file not found")
    
    # Determine media type based on format
    media_type = "application/json"
    if report.format_type == "pdf":
        media_type = "application/pdf"
    elif report.format_type == "html":
        media_type = "text/html"
    elif report.format_type == "csv":
        media_type = "text/csv"
    
    return FileResponse(
        path=report.file_path,
        filename=f"{report.name}.{report.format_type}",
        media_type=media_type
    )


# Direct file serving endpoints
@router.get("/screenshots/files/{filename}")
async def serve_screenshot_file(filename: str):
    """
    Serve screenshot files directly by filename from the artifacts/screenshots directory.
    This endpoint serves files without requiring database records.
    """
    file_path = os.path.join(ARTIFACTS_DIR, "screenshots", filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Screenshot file not found")
    
    if not filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp')):
        raise HTTPException(status_code=400, detail="Invalid image file format")
    
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="image/png"
    )


# Analytics endpoints
@router.get("/analytics/storage", response_model=dict)
async def get_storage_analytics(
    session: AsyncSession = Depends(get_async_session)
):
    # Get screenshot statistics
    screenshot_stats = await session.execute(
        select(
            func.count(Screenshot.id).label("total_screenshots"),
            func.sum(Screenshot.file_size_bytes).label("total_size_bytes"),
            func.avg(Screenshot.file_size_bytes).label("avg_size_bytes"),
        )
    )
    screenshot_data = screenshot_stats.first()
    
    # Get report statistics
    report_stats = await session.execute(
        select(
            func.count(TestReport.id).label("total_reports"),
            func.sum(TestReport.file_size_bytes).label("total_size_bytes"),
        )
    )
    report_data = report_stats.first()
    
    return {
        "screenshots": {
            "count": screenshot_data.total_screenshots or 0,
            "total_size_bytes": int(screenshot_data.total_size_bytes or 0),
            "average_size_bytes": int(screenshot_data.avg_size_bytes or 0),
        },
        "reports": {
            "count": report_data.total_reports or 0,
            "total_size_bytes": int(report_data.total_size_bytes or 0),
        },
        "total_artifacts": (screenshot_data.total_screenshots or 0) + (report_data.total_reports or 0),
        "total_storage_bytes": int((screenshot_data.total_size_bytes or 0) + (report_data.total_size_bytes or 0)),
    }