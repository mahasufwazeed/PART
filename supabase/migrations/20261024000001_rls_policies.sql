-- ============================================================================
-- PART – People At Right Time
-- Migration: 20261024000001_rls_policies.sql
-- Production Row-Level Security (RLS) Policies
-- ============================================================================

-- Helper Function: Check if current authenticated user is an administrator
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND is_admin = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 1. Profiles RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users"
ON public.profiles FOR SELECT
TO authenticated
USING (TRUE);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id AND
    -- Prevent non-admins from promoting themselves to admin
    (is_admin IS FALSE OR public.is_admin_user())
);

CREATE POLICY "Admins have full access to profiles"
ON public.profiles FOR ALL
TO authenticated
USING (public.is_admin_user());

-- ----------------------------------------------------------------------------
-- 2. User Skills RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User skills viewable by authenticated users"
ON public.user_skills FOR SELECT
TO authenticated
USING (TRUE);

CREATE POLICY "Users can manage own skills"
ON public.user_skills FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 3. Task Categories RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.task_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active categories are viewable by all"
ON public.task_categories FOR SELECT
TO authenticated, anon
USING (is_active = TRUE OR public.is_admin_user());

CREATE POLICY "Admins can manage categories"
ON public.task_categories FOR ALL
TO authenticated
USING (public.is_admin_user());

-- ----------------------------------------------------------------------------
-- 4. Tasks RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tasks visibility policy"
ON public.tasks FOR SELECT
TO authenticated
USING (
    status = 'OPEN' OR
    requester_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.task_assignments ta
        WHERE ta.task_id = tasks.id AND ta.worker_id = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM public.task_applications app
        WHERE app.task_id = tasks.id AND app.worker_id = auth.uid()
    ) OR
    public.is_admin_user()
);

CREATE POLICY "Requesters can create tasks"
ON public.tasks FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Requesters and Admins can update tasks"
ON public.tasks FOR UPDATE
TO authenticated
USING (auth.uid() = requester_id OR public.is_admin_user())
WITH CHECK (auth.uid() = requester_id OR public.is_admin_user());

CREATE POLICY "Requesters can delete draft tasks"
ON public.tasks FOR DELETE
TO authenticated
USING ((auth.uid() = requester_id AND status = 'DRAFT') OR public.is_admin_user());

-- ----------------------------------------------------------------------------
-- 5. Task Locations RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.task_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Task locations viewable with tasks"
ON public.task_locations FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.tasks t
        WHERE t.id = task_locations.task_id AND (
            t.status = 'OPEN' OR
            t.requester_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.task_assignments ta
                WHERE ta.task_id = t.id AND ta.worker_id = auth.uid()
            ) OR
            public.is_admin_user()
        )
    )
);

CREATE POLICY "Task requester can insert location"
ON public.task_locations FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.tasks t
        WHERE t.id = task_locations.task_id AND t.requester_id = auth.uid()
    )
);

CREATE POLICY "Task requester can update location"
ON public.task_locations FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.tasks t
        WHERE t.id = task_locations.task_id AND t.requester_id = auth.uid()
    ) OR public.is_admin_user()
);

-- ----------------------------------------------------------------------------
-- 6. Task Applications RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.task_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applications viewable by applicant or requester or admin"
ON public.task_applications FOR SELECT
TO authenticated
USING (
    worker_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.tasks t
        WHERE t.id = task_applications.task_id AND t.requester_id = auth.uid()
    ) OR
    public.is_admin_user()
);

CREATE POLICY "Workers can apply to open tasks (not their own)"
ON public.task_applications FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = worker_id AND
    NOT EXISTS (
        SELECT 1 FROM public.tasks t
        WHERE t.id = task_applications.task_id AND t.requester_id = auth.uid()
    ) AND
    EXISTS (
        SELECT 1 FROM public.tasks t
        WHERE t.id = task_applications.task_id AND t.status = 'OPEN'
    )
);

CREATE POLICY "Applications updatable by participant or admin"
ON public.task_applications FOR UPDATE
TO authenticated
USING (
    worker_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.tasks t
        WHERE t.id = task_applications.task_id AND t.requester_id = auth.uid()
    ) OR
    public.is_admin_user()
);

-- ----------------------------------------------------------------------------
-- 7. Task Assignments RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Assignments viewable by worker, requester or admin"
ON public.task_assignments FOR SELECT
TO authenticated
USING (
    worker_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.tasks t
        WHERE t.id = task_assignments.task_id AND t.requester_id = auth.uid()
    ) OR
    public.is_admin_user()
);

CREATE POLICY "Requesters can assign workers"
ON public.task_assignments FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.tasks t
        WHERE t.id = task_assignments.task_id AND t.requester_id = auth.uid()
    ) OR public.is_admin_user()
);

CREATE POLICY "Assignments updatable by assignment participants or admin"
ON public.task_assignments FOR UPDATE
TO authenticated
USING (
    worker_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.tasks t
        WHERE t.id = task_assignments.task_id AND t.requester_id = auth.uid()
    ) OR
    public.is_admin_user()
);

-- ----------------------------------------------------------------------------
-- 8. Task Status History RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.task_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Task status history viewable by task participants"
ON public.task_status_history FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.tasks t
        WHERE t.id = task_status_history.task_id AND (
            t.requester_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.task_assignments ta
                WHERE ta.task_id = t.id AND ta.worker_id = auth.uid()
            ) OR
            public.is_admin_user()
        )
    )
);

CREATE POLICY "Insert task status history"
ON public.task_status_history FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = changed_by);

-- ----------------------------------------------------------------------------
-- 9 & 10. Conversations and Participants RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conversations viewable by participants"
ON public.conversations FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_participants cp
        WHERE cp.conversation_id = conversations.id AND cp.user_id = auth.uid()
    ) OR public.is_admin_user()
);

CREATE POLICY "Participants viewable by conversation members"
ON public.conversation_participants FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_participants cp
        WHERE cp.conversation_id = conversation_participants.conversation_id AND cp.user_id = auth.uid()
    ) OR public.is_admin_user()
);

CREATE POLICY "Users can insert participants on task assignment"
ON public.conversation_participants FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.conversations c
        JOIN public.tasks t ON t.id = c.task_id
        WHERE c.id = conversation_participants.conversation_id AND (
            t.requester_id = auth.uid() OR
            EXISTS (SELECT 1 FROM public.task_assignments ta WHERE ta.task_id = t.id AND ta.worker_id = auth.uid())
        )
    ) OR public.is_admin_user()
);

-- ----------------------------------------------------------------------------
-- 11 & 12. Messages and Attachments RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Messages viewable by conversation participants"
ON public.messages FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_participants cp
        WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
    ) OR public.is_admin_user()
);

CREATE POLICY "Messages insertable by conversation participants"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
        SELECT 1 FROM public.conversation_participants cp
        WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
    )
);

CREATE POLICY "Attachments viewable by conversation participants"
ON public.message_attachments FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.messages m
        JOIN public.conversation_participants cp ON cp.conversation_id = m.conversation_id
        WHERE m.id = message_attachments.message_id AND cp.user_id = auth.uid()
    ) OR public.is_admin_user()
);

-- ----------------------------------------------------------------------------
-- 13. Task Completion Evidence RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.task_completion_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Evidence viewable by task participants or admin"
ON public.task_completion_evidence FOR SELECT
TO authenticated
USING (
    submitted_by = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.tasks t
        WHERE t.id = task_completion_evidence.task_id AND t.requester_id = auth.uid()
    ) OR public.is_admin_user()
);

CREATE POLICY "Assigned worker can submit evidence"
ON public.task_completion_evidence FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = submitted_by AND
    EXISTS (
        SELECT 1 FROM public.task_assignments ta
        WHERE ta.id = task_completion_evidence.assignment_id AND ta.worker_id = auth.uid()
    )
);

-- ----------------------------------------------------------------------------
-- 14 & 15. Payments and Payment Events RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Payments viewable by payer, payee, or admin"
ON public.payments FOR SELECT
TO authenticated
USING (
    payer_id = auth.uid() OR
    payee_id = auth.uid() OR
    public.is_admin_user()
);

CREATE POLICY "Payments insertable by task payer or system"
ON public.payments FOR INSERT
TO authenticated
WITH CHECK (
    payer_id = auth.uid() OR public.is_admin_user()
);

CREATE POLICY "Payments updatable by admin or authorized service"
ON public.payments FOR UPDATE
TO authenticated
USING (public.is_admin_user());

CREATE POLICY "Payment events viewable by admin"
ON public.payment_events FOR SELECT
TO authenticated
USING (public.is_admin_user());

-- ----------------------------------------------------------------------------
-- 16. Reviews RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews viewable by authenticated users"
ON public.reviews FOR SELECT
TO authenticated
USING (TRUE);

CREATE POLICY "Participants of completed tasks can review"
ON public.reviews FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = reviewer_id AND
    reviewer_id <> reviewee_id AND
    EXISTS (
        SELECT 1 FROM public.tasks t
        WHERE t.id = reviews.task_id AND t.status = 'COMPLETED' AND (
            (t.requester_id = auth.uid() AND reviews.role_reviewed = 'worker') OR
            (EXISTS (
                SELECT 1 FROM public.task_assignments ta
                WHERE ta.task_id = t.id AND ta.worker_id = auth.uid()
            ) AND reviews.role_reviewed = 'requester')
        )
    )
);

-- ----------------------------------------------------------------------------
-- 17. Notifications RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update read status on own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 18. Reports RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports"
ON public.reports FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Reporters can view own reports, admins view all"
ON public.reports FOR SELECT
TO authenticated
USING (reporter_id = auth.uid() OR public.is_admin_user());

CREATE POLICY "Admins can update reports"
ON public.reports FOR UPDATE
TO authenticated
USING (public.is_admin_user());

-- ----------------------------------------------------------------------------
-- 19. Disputes RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Disputes viewable by participants or admin"
ON public.disputes FOR SELECT
TO authenticated
USING (
    raised_by = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.tasks t
        WHERE t.id = disputes.task_id AND (
            t.requester_id = auth.uid() OR
            EXISTS (SELECT 1 FROM public.task_assignments ta WHERE ta.task_id = t.id AND ta.worker_id = auth.uid())
        )
    ) OR
    public.is_admin_user()
);

CREATE POLICY "Participants can open dispute"
ON public.disputes FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = raised_by AND
    EXISTS (
        SELECT 1 FROM public.tasks t
        WHERE t.id = disputes.task_id AND (
            t.requester_id = auth.uid() OR
            EXISTS (SELECT 1 FROM public.task_assignments ta WHERE ta.task_id = t.id AND ta.worker_id = auth.uid())
        )
    )
);

CREATE POLICY "Admins can update disputes"
ON public.disputes FOR UPDATE
TO authenticated
USING (public.is_admin_user());

-- ----------------------------------------------------------------------------
-- 20. User Blocks RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view and manage their own blocks"
ON public.user_blocks FOR ALL
TO authenticated
USING (blocker_id = auth.uid())
WITH CHECK (blocker_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 21. Verification Records RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.verification_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own verification, admins view all"
ON public.verification_records FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin_user());

CREATE POLICY "Users can submit verification records"
ON public.verification_records FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update verification status"
ON public.verification_records FOR UPDATE
TO authenticated
USING (public.is_admin_user());

-- ----------------------------------------------------------------------------
-- 22. Admin Audit Logs RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full access to audit logs"
ON public.admin_audit_logs FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- ----------------------------------------------------------------------------
-- 23. Platform Settings RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform settings viewable by authenticated users"
ON public.platform_settings FOR SELECT
TO authenticated, anon
USING (TRUE);

CREATE POLICY "Only admins can modify platform settings"
ON public.platform_settings FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());
