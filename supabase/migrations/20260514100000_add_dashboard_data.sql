-- Add dashboard_data column to projects table
ALTER TABLE projects ADD COLUMN dashboard_data JSONB;
