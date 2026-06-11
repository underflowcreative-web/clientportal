-- ============================================================
-- Client Portal — Supabase Setup Script
-- Run this entire script in the Supabase SQL Editor
-- ============================================================

-- ============================================
-- 1. PROFILES TABLE (extends auth.users)
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'client')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 2. PROJECTS TABLE
-- ============================================
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  current_status TEXT NOT NULL DEFAULT 'Discovery Call'
    CHECK (current_status IN (
      'Discovery Call', 'Content Collection', 'Wireframe',
      'Development', 'Testing', 'Launch'
    )),
  progress_percentage INTEGER NOT NULL DEFAULT 0
    CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  expected_launch_date DATE,
  next_milestone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_projects_client_id ON public.projects(client_id);

-- ============================================
-- 3. MILESTONES TABLE
-- ============================================
CREATE TABLE public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_date TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_milestones_project_id ON public.milestones(project_id);

-- ============================================
-- 4. FILES TABLE
-- ============================================
CREATE TABLE public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_files_project_id ON public.files(project_id);

-- ============================================
-- 5. CHANGE REQUESTS TABLE
-- ============================================
CREATE TABLE public.change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'Medium'
    CHECK (priority IN ('Low', 'Medium', 'High')),
  status TEXT NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending', 'In Progress', 'Completed')),
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_change_requests_project_id ON public.change_requests(project_id);

-- ============================================
-- 6. INVOICES TABLE
-- ============================================
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Paid', 'Pending', 'Overdue')),
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_invoices_project_id ON public.invoices(project_id);

-- ============================================
-- 7. UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.change_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- 8. HELPER FUNCTION: Check Admin Role
-- ============================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- 9. ROW LEVEL SECURITY — PROFILES
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  USING (public.is_admin());

-- ============================================
-- 10. ROW LEVEL SECURITY — PROJECTS
-- ============================================
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients see own projects"
  ON public.projects FOR SELECT
  USING (client_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins can insert projects"
  ON public.projects FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update projects"
  ON public.projects FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete projects"
  ON public.projects FOR DELETE
  USING (public.is_admin());

-- ============================================
-- 11. ROW LEVEL SECURITY — MILESTONES
-- ============================================
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View milestones for accessible projects"
  ON public.milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = milestones.project_id
      AND (projects.client_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Admins can insert milestones"
  ON public.milestones FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update milestones"
  ON public.milestones FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete milestones"
  ON public.milestones FOR DELETE
  USING (public.is_admin());

-- ============================================
-- 12. ROW LEVEL SECURITY — FILES
-- ============================================
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View files for accessible projects"
  ON public.files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = files.project_id
      AND (projects.client_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Upload files to accessible projects"
  ON public.files FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid() AND (
      EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = files.project_id
        AND (projects.client_id = auth.uid() OR public.is_admin())
      )
    )
  );

CREATE POLICY "Admins can update files"
  ON public.files FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete files"
  ON public.files FOR DELETE
  USING (public.is_admin());

-- ============================================
-- 13. ROW LEVEL SECURITY — CHANGE REQUESTS
-- ============================================
ALTER TABLE public.change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View requests for accessible projects"
  ON public.change_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = change_requests.project_id
      AND (projects.client_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Create requests for own projects"
  ON public.change_requests FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND (
      EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = change_requests.project_id
        AND (projects.client_id = auth.uid() OR public.is_admin())
      )
    )
  );

CREATE POLICY "Admins can update requests"
  ON public.change_requests FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete requests"
  ON public.change_requests FOR DELETE
  USING (public.is_admin());

-- ============================================
-- 14. ROW LEVEL SECURITY — INVOICES
-- ============================================
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View invoices for accessible projects"
  ON public.invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = invoices.project_id
      AND (projects.client_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Admins can insert invoices"
  ON public.invoices FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update invoices"
  ON public.invoices FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete invoices"
  ON public.invoices FOR DELETE
  USING (public.is_admin());

-- ============================================
-- 15. STORAGE BUCKETS
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', false);

INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', false);

-- Storage policies: project-files
CREATE POLICY "Auth users can upload project files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'project-files');

CREATE POLICY "Auth users can view project files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'project-files');

CREATE POLICY "Auth users can update project files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'project-files');

CREATE POLICY "Admins can delete project files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'project-files' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Storage policies: invoices
CREATE POLICY "Admins can upload invoices"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'invoices' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Auth users can view invoices"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'invoices');

CREATE POLICY "Admins can delete invoice files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'invoices' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- 16. ENABLE REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.milestones;
ALTER PUBLICATION supabase_realtime ADD TABLE public.change_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;

-- ============================================
-- 17. SEED: Create first admin user
-- Run AFTER you sign up your first admin user via the app.
-- Replace 'YOUR_ADMIN_USER_ID' with the actual UUID.
-- ============================================
-- UPDATE public.profiles SET role = 'admin' WHERE id = 'YOUR_ADMIN_USER_ID';
