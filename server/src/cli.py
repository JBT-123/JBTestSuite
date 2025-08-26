#!/usr/bin/env python3
"""
JBTestSuite CLI Management Tool
Database operations, seeding, and development utilities
"""

import asyncio
import sys
from typing import Optional

import click
from sqlalchemy import text

from src.core.database import get_async_session, engine
from src.core.seeder import seed_database


@click.group()
def cli():
    """JBTestSuite CLI Management Tool"""
    pass


@cli.group()
def db():
    """Database management commands"""
    pass


@db.command()
@click.option('--clear', is_flag=True, help='Clear existing data before seeding')
def seed(clear: bool):
    """Seed database with sample data"""
    click.echo("🌱 Starting database seeding...")
    
    try:
        asyncio.run(seed_database(clear_existing=clear))
        click.echo("✅ Database seeding completed successfully!")
    except Exception as e:
        click.echo(f"❌ Database seeding failed: {e}", err=True)
        sys.exit(1)


@db.command()
@click.confirmation_option(prompt='Are you sure you want to clear all data?')
def clear():
    """Clear all data from database (DESTRUCTIVE)"""
    click.echo("🗑️  Clearing all database data...")
    
    async def clear_data():
        async with get_async_session() as session:
            # Clear all tables in dependency order
            tables = [
                "log_entries",
                "screenshots", 
                "test_step_executions",
                "test_executions",
                "test_runs",
                "test_suite_test_cases",
                "test_steps",
                "test_cases", 
                "test_suites",
                "browser_configurations",
                "test_environments"
            ]
            
            for table in tables:
                await session.execute(text(f"DELETE FROM {table}"))
            
            await session.commit()
    
    try:
        asyncio.run(clear_data())
        click.echo("✅ All data cleared successfully!")
    except Exception as e:
        click.echo(f"❌ Failed to clear data: {e}", err=True)
        sys.exit(1)


@db.command()
def status():
    """Show database status and table counts"""
    click.echo("📊 Database Status:")
    
    async def get_status():
        async with get_async_session() as session:
            tables = [
                "test_environments",
                "browser_configurations", 
                "test_suites",
                "test_cases",
                "test_steps", 
                "test_runs",
                "test_executions",
                "test_step_executions",
                "screenshots",
                "log_entries"
            ]
            
            for table in tables:
                result = await session.execute(text(f"SELECT COUNT(*) FROM {table}"))
                count = result.scalar()
                click.echo(f"  {table}: {count} records")
    
    try:
        asyncio.run(get_status())
    except Exception as e:
        click.echo(f"❌ Failed to get database status: {e}", err=True)
        sys.exit(1)


@db.command()
def init():
    """Initialize database tables"""
    click.echo("🔨 Initializing database tables...")
    
    async def init_tables():
        from src.core.database import create_tables
        await create_tables()
    
    try:
        asyncio.run(init_tables())
        click.echo("✅ Database tables initialized successfully!")
    except Exception as e:
        click.echo(f"❌ Failed to initialize database: {e}", err=True)
        sys.exit(1)


@cli.group()
def test():
    """Testing utilities"""
    pass


@test.command()
@click.option('--pattern', default='test_*.py', help='Test file pattern')
@click.option('--verbose', '-v', is_flag=True, help='Verbose output')
def run(pattern: str, verbose: bool):
    """Run tests"""
    import subprocess
    
    cmd = ['pytest']
    
    if verbose:
        cmd.append('-v')
    
    cmd.extend(['-k', pattern])
    
    click.echo(f"🧪 Running tests with pattern: {pattern}")
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        click.echo(result.stdout)
        if result.stderr:
            click.echo(result.stderr, err=True)
        
        if result.returncode == 0:
            click.echo("✅ All tests passed!")
        else:
            click.echo("❌ Some tests failed!")
            sys.exit(result.returncode)
    except FileNotFoundError:
        click.echo("❌ pytest not found. Install it with: pip install pytest", err=True)
        sys.exit(1)


@test.command()
def coverage():
    """Run tests with coverage report"""
    import subprocess
    
    cmd = ['pytest', '--cov=src', '--cov-report=html', '--cov-report=term-missing']
    
    click.echo("📊 Running tests with coverage...")
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        click.echo(result.stdout)
        if result.stderr:
            click.echo(result.stderr, err=True)
        
        click.echo("📄 Coverage report generated in htmlcov/index.html")
        
        if result.returncode != 0:
            sys.exit(result.returncode)
    except FileNotFoundError:
        click.echo("❌ pytest or coverage not found. Install with: pip install pytest pytest-cov", err=True)
        sys.exit(1)


@cli.group()  
def dev():
    """Development utilities"""
    pass


@dev.command()
def server():
    """Start development server with auto-reload"""
    import subprocess
    
    cmd = [
        'uvicorn', 
        'src.main:app',
        '--host', '0.0.0.0',
        '--port', '8000', 
        '--reload'
    ]
    
    click.echo("🚀 Starting development server...")
    click.echo("Server will be available at: http://localhost:8000")
    click.echo("API documentation at: http://localhost:8000/docs")
    
    try:
        subprocess.run(cmd)
    except KeyboardInterrupt:
        click.echo("\n👋 Server stopped!")
    except FileNotFoundError:
        click.echo("❌ uvicorn not found. Install it with: pip install uvicorn", err=True)
        sys.exit(1)


@dev.command()
def check():
    """Run code quality checks (format, lint, type check)"""
    import subprocess
    
    checks = [
        {
            'name': 'Code Formatting (Black)',
            'cmd': ['black', '--check', 'src/'],
            'fix_cmd': ['black', 'src/']
        },
        {
            'name': 'Import Sorting (isort)', 
            'cmd': ['isort', '--check-only', 'src/'],
            'fix_cmd': ['isort', 'src/']
        },
        {
            'name': 'Type Checking (MyPy)',
            'cmd': ['mypy', 'src/'],
            'fix_cmd': None
        }
    ]
    
    failed_checks = []
    
    for check in checks:
        click.echo(f"🔍 Running {check['name']}...")
        
        try:
            result = subprocess.run(check['cmd'], capture_output=True, text=True)
            
            if result.returncode == 0:
                click.echo(f"✅ {check['name']} passed!")
            else:
                click.echo(f"❌ {check['name']} failed!")
                click.echo(result.stdout)
                if result.stderr:
                    click.echo(result.stderr, err=True)
                
                failed_checks.append(check)
                
        except FileNotFoundError:
            click.echo(f"❌ {check['name']} tool not found. Install dev dependencies.", err=True)
    
    if failed_checks:
        click.echo(f"\n❌ {len(failed_checks)} checks failed!")
        
        if click.confirm("Would you like to auto-fix what can be fixed?"):
            for check in failed_checks:
                if check['fix_cmd']:
                    click.echo(f"🔧 Fixing {check['name']}...")
                    subprocess.run(check['fix_cmd'])
        
        sys.exit(1)
    else:
        click.echo("\n✅ All code quality checks passed!")


@cli.command()
def info():
    """Show system information"""
    import platform
    import sys
    from sqlalchemy import __version__ as sqlalchemy_version
    from fastapi import __version__ as fastapi_version
    
    click.echo("📋 JBTestSuite System Information:")
    click.echo(f"  Python Version: {sys.version}")
    click.echo(f"  Platform: {platform.platform()}")
    click.echo(f"  FastAPI Version: {fastapi_version}")
    click.echo(f"  SQLAlchemy Version: {sqlalchemy_version}")
    
    # Database connection test
    async def test_db():
        try:
            async with get_async_session() as session:
                await session.execute(text("SELECT 1"))
            return True
        except Exception as e:
            click.echo(f"  Database Error: {e}")
            return False
    
    try:
        db_connected = asyncio.run(test_db())
        status = "✅ Connected" if db_connected else "❌ Disconnected"
        click.echo(f"  Database Status: {status}")
    except Exception as e:
        click.echo(f"  Database Status: ❌ Error - {e}")


if __name__ == '__main__':
    cli()