"""Add comprehensive enhanced database models for testing platform

Revision ID: 001
Revises: 
Create Date: 2025-08-26 13:15:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create test_environments table
    op.create_table('test_environments',
    sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('base_url', sa.String(length=500), nullable=False),
    sa.Column('environment_type', sa.String(length=50), nullable=False, server_default='development'),
    sa.Column('database_config', sa.JSON(), nullable=True),
    sa.Column('api_config', sa.JSON(), nullable=True),
    sa.Column('authentication_config', sa.JSON(), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
    sa.Column('requires_vpn', sa.Boolean(), nullable=False, server_default='false'),
    sa.Column('health_check_url', sa.String(length=500), nullable=True),
    sa.Column('variables', sa.JSON(), nullable=True),
    sa.Column('secrets', sa.JSON(), nullable=True),
    sa.Column('created_by', sa.String(length=100), nullable=True),
    sa.UniqueConstraint('name'),
    )
    
    # Create browser_configurations table
    op.create_table('browser_configurations',
    sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('browser_type', sa.String(length=50), nullable=False),
    sa.Column('browser_version', sa.String(length=50), nullable=True),
    sa.Column('headless', sa.Boolean(), nullable=False, server_default='true'),
    sa.Column('window_width', sa.Integer(), nullable=False, server_default='1920'),
    sa.Column('window_height', sa.Integer(), nullable=False, server_default='1080'),
    sa.Column('user_agent', sa.Text(), nullable=True),
    sa.Column('enable_screenshots', sa.Boolean(), nullable=False, server_default='true'),
    sa.Column('screenshot_on_failure', sa.Boolean(), nullable=False, server_default='true'),
    sa.Column('page_load_timeout_seconds', sa.Integer(), nullable=False, server_default='30'),
    sa.Column('implicit_wait_seconds', sa.Integer(), nullable=False, server_default='10'),
    sa.Column('script_timeout_seconds', sa.Integer(), nullable=False, server_default='30'),
    sa.Column('proxy_settings', sa.JSON(), nullable=True),
    sa.Column('browser_options', sa.JSON(), nullable=True),
    sa.Column('capabilities', sa.JSON(), nullable=True),
    sa.Column('is_default', sa.Boolean(), nullable=False, server_default='false'),
    sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
    sa.Column('created_by', sa.String(length=100), nullable=True),
    )
    
    # Create test_suites table
    op.create_table('test_suites',
    sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('tags', sa.JSON(), nullable=True),
    sa.Column('configuration', sa.JSON(), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
    sa.Column('created_by', sa.String(length=100), nullable=True),
    )
    
    # Create test_cases table
    op.create_table('test_cases',
    sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('status', sa.String(length=50), nullable=False, server_default='draft'),
    sa.Column('priority', sa.String(length=50), nullable=False, server_default='medium'),
    sa.Column('tags', sa.JSON(), nullable=True),
    sa.Column('metadata', sa.JSON(), nullable=True),
    sa.Column('author', sa.String(length=100), nullable=True),
    sa.Column('category', sa.String(length=100), nullable=True),
    sa.Column('expected_duration_seconds', sa.Integer(), nullable=True),
    sa.Column('is_automated', sa.Boolean(), nullable=False, server_default='true'),
    sa.Column('retry_count', sa.Integer(), nullable=False, server_default='0'),
    )
    
    # Create test_steps table
    op.create_table('test_steps',
    sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('test_case_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('order_index', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('step_type', sa.String(length=50), nullable=False),
    sa.Column('selector', sa.String(length=500), nullable=True),
    sa.Column('input_data', sa.Text(), nullable=True),
    sa.Column('expected_result', sa.Text(), nullable=True),
    sa.Column('configuration', sa.JSON(), nullable=True),
    sa.Column('timeout_seconds', sa.Integer(), nullable=True, server_default='30'),
    sa.Column('is_optional', sa.Boolean(), nullable=False, server_default='false'),
    sa.Column('continue_on_failure', sa.Boolean(), nullable=False, server_default='false'),
    sa.ForeignKeyConstraint(['test_case_id'], ['test_cases.id'], ),
    )
    
    # Create test_runs table
    op.create_table('test_runs',
    sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('status', sa.String(length=50), nullable=False, server_default='pending'),
    sa.Column('test_suite_id', postgresql.UUID(as_uuid=True), nullable=True),
    sa.Column('browser_config_id', postgresql.UUID(as_uuid=True), nullable=True),
    sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('total_tests', sa.Integer(), nullable=False, server_default='0'),
    sa.Column('passed_tests', sa.Integer(), nullable=False, server_default='0'),
    sa.Column('failed_tests', sa.Integer(), nullable=False, server_default='0'),
    sa.Column('skipped_tests', sa.Integer(), nullable=False, server_default='0'),
    sa.Column('progress_percentage', sa.Float(), nullable=False, server_default='0.0'),
    sa.Column('triggered_by', sa.String(length=100), nullable=True),
    sa.Column('environment', sa.String(length=100), nullable=True),
    sa.Column('configuration', sa.JSON(), nullable=True),
    sa.Column('metadata', sa.JSON(), nullable=True),
    sa.ForeignKeyConstraint(['browser_config_id'], ['browser_configurations.id'], ),
    sa.ForeignKeyConstraint(['test_suite_id'], ['test_suites.id'], ),
    )
    
    # Create test_executions table
    op.create_table('test_executions',
    sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('test_run_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('test_case_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('status', sa.String(length=50), nullable=False, server_default='pending'),
    sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('duration_seconds', sa.Float(), nullable=True),
    sa.Column('error_message', sa.Text(), nullable=True),
    sa.Column('error_type', sa.String(length=100), nullable=True),
    sa.Column('stack_trace', sa.Text(), nullable=True),
    sa.Column('retry_count', sa.Integer(), nullable=False, server_default='0'),
    sa.Column('max_retries', sa.Integer(), nullable=False, server_default='0'),
    sa.Column('browser_session_id', sa.String(length=255), nullable=True),
    sa.Column('execution_context', sa.JSON(), nullable=True),
    sa.Column('performance_metrics', sa.JSON(), nullable=True),
    sa.ForeignKeyConstraint(['test_case_id'], ['test_cases.id'], ),
    sa.ForeignKeyConstraint(['test_run_id'], ['test_runs.id'], ),
    )
    
    # Create test_step_executions table
    op.create_table('test_step_executions',
    sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('test_execution_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('test_step_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('order_index', sa.Integer(), nullable=False),
    sa.Column('status', sa.String(length=50), nullable=False, server_default='pending'),
    sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('duration_seconds', sa.Float(), nullable=True),
    sa.Column('input_data', sa.Text(), nullable=True),
    sa.Column('actual_result', sa.Text(), nullable=True),
    sa.Column('expected_result', sa.Text(), nullable=True),
    sa.Column('error_message', sa.Text(), nullable=True),
    sa.Column('error_type', sa.String(length=100), nullable=True),
    sa.Column('retry_count', sa.Integer(), nullable=False, server_default='0'),
    sa.Column('element_screenshot_path', sa.String(length=500), nullable=True),
    sa.Column('execution_data', sa.JSON(), nullable=True),
    sa.ForeignKeyConstraint(['test_execution_id'], ['test_executions.id'], ),
    sa.ForeignKeyConstraint(['test_step_id'], ['test_steps.id'], ),
    )
    
    # Create screenshots table
    op.create_table('screenshots',
    sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('test_execution_id', postgresql.UUID(as_uuid=True), nullable=True),
    sa.Column('test_step_execution_id', postgresql.UUID(as_uuid=True), nullable=True),
    sa.Column('filename', sa.String(length=255), nullable=False),
    sa.Column('file_path', sa.String(length=500), nullable=False),
    sa.Column('file_size_bytes', sa.BigInteger(), nullable=True),
    sa.Column('screenshot_type', sa.String(length=50), nullable=False, server_default='manual'),
    sa.Column('width', sa.Integer(), nullable=True),
    sa.Column('height', sa.Integer(), nullable=True),
    sa.Column('element_selector', sa.String(length=500), nullable=True),
    sa.Column('element_position', sa.JSON(), nullable=True),
    sa.Column('browser_info', sa.JSON(), nullable=True),
    sa.Column('viewport_size', sa.JSON(), nullable=True),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('metadata', sa.JSON(), nullable=True),
    sa.ForeignKeyConstraint(['test_execution_id'], ['test_executions.id'], ),
    sa.ForeignKeyConstraint(['test_step_execution_id'], ['test_step_executions.id'], ),
    )
    
    # Create log_entries table
    op.create_table('log_entries',
    sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('test_execution_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('level', sa.String(length=50), nullable=False),
    sa.Column('message', sa.Text(), nullable=False),
    sa.Column('source', sa.String(length=100), nullable=True),
    sa.Column('category', sa.String(length=100), nullable=True),
    sa.Column('step_order_index', sa.Integer(), nullable=True),
    sa.Column('browser_session_id', sa.String(length=255), nullable=True),
    sa.Column('stack_trace', sa.Text(), nullable=True),
    sa.Column('context_data', sa.JSON(), nullable=True),
    sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['test_execution_id'], ['test_executions.id'], ),
    )
    
    # Create test_reports table
    op.create_table('test_reports',
    sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('test_run_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('report_type', sa.String(length=50), nullable=False, server_default='execution_summary'),
    sa.Column('format_type', sa.String(length=20), nullable=False, server_default='json'),
    sa.Column('file_path', sa.String(length=500), nullable=True),
    sa.Column('file_size_bytes', sa.BigInteger(), nullable=True),
    sa.Column('generation_started_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('generation_completed_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('summary_data', sa.JSON(), nullable=True),
    sa.Column('configuration', sa.JSON(), nullable=True),
    sa.Column('is_public', sa.Boolean(), nullable=False, server_default='false'),
    sa.Column('generated_by', sa.String(length=100), nullable=True),
    sa.ForeignKeyConstraint(['test_run_id'], ['test_runs.id'], ),
    )
    
    # Create test_suite_test_cases association table
    op.create_table('test_suite_test_cases',
    sa.Column('test_suite_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('test_case_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('order_index', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['test_case_id'], ['test_cases.id'], ),
    sa.ForeignKeyConstraint(['test_suite_id'], ['test_suites.id'], ),
    sa.PrimaryKeyConstraint('test_suite_id', 'test_case_id'),
    )

    # Create indexes for performance optimization
    
    # TimestampedModel base indexes (for all tables with created_at/updated_at)
    op.create_index('ix_test_environments_created_at', 'test_environments', ['created_at'])
    op.create_index('ix_test_environments_updated_at', 'test_environments', ['updated_at'])
    op.create_index('ix_browser_configurations_created_at', 'browser_configurations', ['created_at'])
    op.create_index('ix_browser_configurations_updated_at', 'browser_configurations', ['updated_at'])
    op.create_index('ix_test_suites_created_at', 'test_suites', ['created_at'])
    op.create_index('ix_test_suites_updated_at', 'test_suites', ['updated_at'])
    op.create_index('ix_test_cases_created_at', 'test_cases', ['created_at'])
    op.create_index('ix_test_cases_updated_at', 'test_cases', ['updated_at'])
    op.create_index('ix_test_steps_created_at', 'test_steps', ['created_at'])
    op.create_index('ix_test_steps_updated_at', 'test_steps', ['updated_at'])
    op.create_index('ix_test_runs_created_at', 'test_runs', ['created_at'])
    op.create_index('ix_test_runs_updated_at', 'test_runs', ['updated_at'])
    op.create_index('ix_test_executions_created_at', 'test_executions', ['created_at'])
    op.create_index('ix_test_executions_updated_at', 'test_executions', ['updated_at'])
    op.create_index('ix_test_step_executions_created_at', 'test_step_executions', ['created_at'])
    op.create_index('ix_test_step_executions_updated_at', 'test_step_executions', ['updated_at'])
    op.create_index('ix_screenshots_created_at', 'screenshots', ['created_at'])
    op.create_index('ix_screenshots_updated_at', 'screenshots', ['updated_at'])
    op.create_index('ix_log_entries_created_at', 'log_entries', ['created_at'])
    op.create_index('ix_log_entries_updated_at', 'log_entries', ['updated_at'])
    op.create_index('ix_test_reports_created_at', 'test_reports', ['created_at'])
    op.create_index('ix_test_reports_updated_at', 'test_reports', ['updated_at'])
    
    # Test Environment indexes
    op.create_index('ix_test_environments_name', 'test_environments', ['name'])
    op.create_index('ix_test_environments_environment_type', 'test_environments', ['environment_type'])
    op.create_index('ix_test_environments_is_active', 'test_environments', ['is_active'])
    op.create_index('ix_test_environments_type_active', 'test_environments', ['environment_type', 'is_active'])
    
    # Browser Configuration indexes
    op.create_index('ix_browser_configurations_name', 'browser_configurations', ['name'])
    op.create_index('ix_browser_configurations_browser_type', 'browser_configurations', ['browser_type'])
    op.create_index('ix_browser_configurations_is_default', 'browser_configurations', ['is_default'])
    op.create_index('ix_browser_configurations_is_active', 'browser_configurations', ['is_active'])
    op.create_index('ix_browser_configs_type_active', 'browser_configurations', ['browser_type', 'is_active'])
    op.create_index('ix_browser_configs_default_active', 'browser_configurations', ['is_default', 'is_active'])
    
    # Test Suite indexes
    op.create_index('ix_test_suites_name', 'test_suites', ['name'])
    op.create_index('ix_test_suites_is_active', 'test_suites', ['is_active'])
    op.create_index('ix_test_suites_created_by', 'test_suites', ['created_by'])
    op.create_index('ix_test_suites_active_name', 'test_suites', ['is_active', 'name'])
    
    # Test Case indexes
    op.create_index('ix_test_cases_name', 'test_cases', ['name'])
    op.create_index('ix_test_cases_status', 'test_cases', ['status'])
    op.create_index('ix_test_cases_priority', 'test_cases', ['priority'])
    op.create_index('ix_test_cases_author', 'test_cases', ['author'])
    op.create_index('ix_test_cases_category', 'test_cases', ['category'])
    op.create_index('ix_test_cases_is_automated', 'test_cases', ['is_automated'])
    op.create_index('ix_test_cases_status_priority', 'test_cases', ['status', 'priority'])
    op.create_index('ix_test_cases_category_status', 'test_cases', ['category', 'status'])
    op.create_index('ix_test_cases_author_status', 'test_cases', ['author', 'status'])
    
    # Test Step indexes
    op.create_index('ix_test_steps_test_case_id', 'test_steps', ['test_case_id'])
    op.create_index('ix_test_steps_step_type', 'test_steps', ['step_type'])
    op.create_index('ix_test_steps_case_order', 'test_steps', ['test_case_id', 'order_index'])
    
    # Test Run indexes
    op.create_index('ix_test_runs_status', 'test_runs', ['status'])
    op.create_index('ix_test_runs_test_suite_id', 'test_runs', ['test_suite_id'])
    op.create_index('ix_test_runs_browser_config_id', 'test_runs', ['browser_config_id'])
    op.create_index('ix_test_runs_environment', 'test_runs', ['environment'])
    op.create_index('ix_test_runs_status_created', 'test_runs', ['status', 'created_at'])
    op.create_index('ix_test_runs_suite_status', 'test_runs', ['test_suite_id', 'status'])
    op.create_index('ix_test_runs_environment_status', 'test_runs', ['environment', 'status'])
    
    # Test Execution indexes
    op.create_index('ix_test_executions_test_run_id', 'test_executions', ['test_run_id'])
    op.create_index('ix_test_executions_test_case_id', 'test_executions', ['test_case_id'])
    op.create_index('ix_test_executions_status', 'test_executions', ['status'])
    op.create_index('ix_test_executions_run_status', 'test_executions', ['test_run_id', 'status'])
    op.create_index('ix_test_executions_case_status', 'test_executions', ['test_case_id', 'status'])
    op.create_index('ix_test_executions_status_completed', 'test_executions', ['status', 'completed_at'])
    
    # Test Step Execution indexes
    op.create_index('ix_test_step_executions_test_execution_id', 'test_step_executions', ['test_execution_id'])
    op.create_index('ix_test_step_executions_test_step_id', 'test_step_executions', ['test_step_id'])
    op.create_index('ix_test_step_executions_status', 'test_step_executions', ['status'])
    op.create_index('ix_test_step_executions_execution_order', 'test_step_executions', ['test_execution_id', 'order_index'])
    op.create_index('ix_test_step_executions_step_status', 'test_step_executions', ['test_step_id', 'status'])
    op.create_index('ix_test_step_executions_status_completed', 'test_step_executions', ['status', 'completed_at'])
    
    # Screenshot indexes
    op.create_index('ix_screenshots_test_execution_id', 'screenshots', ['test_execution_id'])
    op.create_index('ix_screenshots_test_step_execution_id', 'screenshots', ['test_step_execution_id'])
    op.create_index('ix_screenshots_screenshot_type', 'screenshots', ['screenshot_type'])
    op.create_index('ix_screenshots_execution_type', 'screenshots', ['test_execution_id', 'screenshot_type'])
    op.create_index('ix_screenshots_step_execution_type', 'screenshots', ['test_step_execution_id', 'screenshot_type'])
    op.create_index('ix_screenshots_type_created', 'screenshots', ['screenshot_type', 'created_at'])
    
    # Log Entry indexes
    op.create_index('ix_log_entries_test_execution_id', 'log_entries', ['test_execution_id'])
    op.create_index('ix_log_entries_level', 'log_entries', ['level'])
    op.create_index('ix_log_entries_source', 'log_entries', ['source'])
    op.create_index('ix_log_entries_timestamp', 'log_entries', ['timestamp'])
    op.create_index('ix_log_entries_execution_level', 'log_entries', ['test_execution_id', 'level'])
    op.create_index('ix_log_entries_execution_timestamp', 'log_entries', ['test_execution_id', 'timestamp'])
    op.create_index('ix_log_entries_level_timestamp', 'log_entries', ['level', 'timestamp'])
    op.create_index('ix_log_entries_source_level', 'log_entries', ['source', 'level'])
    
    # Test Report indexes
    op.create_index('ix_test_reports_test_run_id', 'test_reports', ['test_run_id'])
    op.create_index('ix_test_reports_run_type', 'test_reports', ['test_run_id', 'report_type'])
    op.create_index('ix_test_reports_type_created', 'test_reports', ['report_type', 'created_at'])


def downgrade() -> None:
    # Drop indexes first
    op.drop_index('ix_test_reports_type_created', table_name='test_reports')
    op.drop_index('ix_test_reports_run_type', table_name='test_reports')
    op.drop_index('ix_test_reports_test_run_id', table_name='test_reports')
    op.drop_index('ix_log_entries_source_level', table_name='log_entries')
    op.drop_index('ix_log_entries_level_timestamp', table_name='log_entries')
    op.drop_index('ix_log_entries_execution_timestamp', table_name='log_entries')
    op.drop_index('ix_log_entries_execution_level', table_name='log_entries')
    op.drop_index('ix_log_entries_timestamp', table_name='log_entries')
    op.drop_index('ix_log_entries_source', table_name='log_entries')
    op.drop_index('ix_log_entries_level', table_name='log_entries')
    op.drop_index('ix_log_entries_test_execution_id', table_name='log_entries')
    op.drop_index('ix_screenshots_type_created', table_name='screenshots')
    op.drop_index('ix_screenshots_step_execution_type', table_name='screenshots')
    op.drop_index('ix_screenshots_execution_type', table_name='screenshots')
    op.drop_index('ix_screenshots_screenshot_type', table_name='screenshots')
    op.drop_index('ix_screenshots_test_step_execution_id', table_name='screenshots')
    op.drop_index('ix_screenshots_test_execution_id', table_name='screenshots')
    op.drop_index('ix_test_step_executions_status_completed', table_name='test_step_executions')
    op.drop_index('ix_test_step_executions_step_status', table_name='test_step_executions')
    op.drop_index('ix_test_step_executions_execution_order', table_name='test_step_executions')
    op.drop_index('ix_test_step_executions_status', table_name='test_step_executions')
    op.drop_index('ix_test_step_executions_test_step_id', table_name='test_step_executions')
    op.drop_index('ix_test_step_executions_test_execution_id', table_name='test_step_executions')
    op.drop_index('ix_test_executions_status_completed', table_name='test_executions')
    op.drop_index('ix_test_executions_case_status', table_name='test_executions')
    op.drop_index('ix_test_executions_run_status', table_name='test_executions')
    op.drop_index('ix_test_executions_status', table_name='test_executions')
    op.drop_index('ix_test_executions_test_case_id', table_name='test_executions')
    op.drop_index('ix_test_executions_test_run_id', table_name='test_executions')
    op.drop_index('ix_test_runs_environment_status', table_name='test_runs')
    op.drop_index('ix_test_runs_suite_status', table_name='test_runs')
    op.drop_index('ix_test_runs_status_created', table_name='test_runs')
    op.drop_index('ix_test_runs_environment', table_name='test_runs')
    op.drop_index('ix_test_runs_browser_config_id', table_name='test_runs')
    op.drop_index('ix_test_runs_test_suite_id', table_name='test_runs')
    op.drop_index('ix_test_runs_status', table_name='test_runs')
    op.drop_index('ix_test_steps_case_order', table_name='test_steps')
    op.drop_index('ix_test_steps_step_type', table_name='test_steps')
    op.drop_index('ix_test_steps_test_case_id', table_name='test_steps')
    op.drop_index('ix_test_cases_author_status', table_name='test_cases')
    op.drop_index('ix_test_cases_category_status', table_name='test_cases')
    op.drop_index('ix_test_cases_status_priority', table_name='test_cases')
    op.drop_index('ix_test_cases_is_automated', table_name='test_cases')
    op.drop_index('ix_test_cases_category', table_name='test_cases')
    op.drop_index('ix_test_cases_author', table_name='test_cases')
    op.drop_index('ix_test_cases_priority', table_name='test_cases')
    op.drop_index('ix_test_cases_status', table_name='test_cases')
    op.drop_index('ix_test_cases_name', table_name='test_cases')
    op.drop_index('ix_test_suites_active_name', table_name='test_suites')
    op.drop_index('ix_test_suites_created_by', table_name='test_suites')
    op.drop_index('ix_test_suites_is_active', table_name='test_suites')
    op.drop_index('ix_test_suites_name', table_name='test_suites')
    op.drop_index('ix_browser_configs_default_active', table_name='browser_configurations')
    op.drop_index('ix_browser_configs_type_active', table_name='browser_configurations')
    op.drop_index('ix_browser_configurations_is_active', table_name='browser_configurations')
    op.drop_index('ix_browser_configurations_is_default', table_name='browser_configurations')
    op.drop_index('ix_browser_configurations_browser_type', table_name='browser_configurations')
    op.drop_index('ix_browser_configurations_name', table_name='browser_configurations')
    op.drop_index('ix_test_environments_type_active', table_name='test_environments')
    op.drop_index('ix_test_environments_is_active', table_name='test_environments')
    op.drop_index('ix_test_environments_environment_type', table_name='test_environments')
    op.drop_index('ix_test_environments_name', table_name='test_environments')
    
    # Drop timestamp indexes
    op.drop_index('ix_test_reports_updated_at', table_name='test_reports')
    op.drop_index('ix_test_reports_created_at', table_name='test_reports')
    op.drop_index('ix_log_entries_updated_at', table_name='log_entries')
    op.drop_index('ix_log_entries_created_at', table_name='log_entries')
    op.drop_index('ix_screenshots_updated_at', table_name='screenshots')
    op.drop_index('ix_screenshots_created_at', table_name='screenshots')
    op.drop_index('ix_test_step_executions_updated_at', table_name='test_step_executions')
    op.drop_index('ix_test_step_executions_created_at', table_name='test_step_executions')
    op.drop_index('ix_test_executions_updated_at', table_name='test_executions')
    op.drop_index('ix_test_executions_created_at', table_name='test_executions')
    op.drop_index('ix_test_runs_updated_at', table_name='test_runs')
    op.drop_index('ix_test_runs_created_at', table_name='test_runs')
    op.drop_index('ix_test_steps_updated_at', table_name='test_steps')
    op.drop_index('ix_test_steps_created_at', table_name='test_steps')
    op.drop_index('ix_test_cases_updated_at', table_name='test_cases')
    op.drop_index('ix_test_cases_created_at', table_name='test_cases')
    op.drop_index('ix_test_suites_updated_at', table_name='test_suites')
    op.drop_index('ix_test_suites_created_at', table_name='test_suites')
    op.drop_index('ix_browser_configurations_updated_at', table_name='browser_configurations')
    op.drop_index('ix_browser_configurations_created_at', table_name='browser_configurations')
    op.drop_index('ix_test_environments_updated_at', table_name='test_environments')
    op.drop_index('ix_test_environments_created_at', table_name='test_environments')

    # Drop tables in reverse dependency order
    op.drop_table('test_suite_test_cases')
    op.drop_table('test_reports')
    op.drop_table('log_entries')
    op.drop_table('screenshots')
    op.drop_table('test_step_executions')
    op.drop_table('test_executions')
    op.drop_table('test_runs')
    op.drop_table('test_steps')
    op.drop_table('test_cases')
    op.drop_table('test_suites')
    op.drop_table('browser_configurations')
    op.drop_table('test_environments')