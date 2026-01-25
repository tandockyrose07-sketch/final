-- Add new columns to people table for enhanced student/staff data
ALTER TABLE public.people 
ADD COLUMN IF NOT EXISTS mobile_number TEXT,
ADD COLUMN IF NOT EXISTS student_type TEXT CHECK (student_type IN ('college', 'senior_high') OR student_type IS NULL),
ADD COLUMN IF NOT EXISTS strand TEXT CHECK (strand IN ('CSS', 'HUMS') OR strand IS NULL);

-- Add comment for documentation
COMMENT ON COLUMN public.people.mobile_number IS 'Mobile phone number';
COMMENT ON COLUMN public.people.student_type IS 'For students: college or senior_high';
COMMENT ON COLUMN public.people.strand IS 'For senior high students: CSS or HUMS';