-- 🚀 organizations 테이블 Seed 데이터
INSERT INTO public.organizations (name) VALUES 
    ('ABC University'),
    ('XYZ Company'),
    ('Open Learning Institute');

-- 🚀 users 테이블 Seed 데이터 (각 조직에 소속된 유저)
INSERT INTO public.users (first_name, last_name, role, organization_id, marketing_opt_in, privacy_agreed)
VALUES
    ('Alice', 'Johnson', 'student', 1, TRUE, TRUE),
    ('Bob', 'Smith', 'teacher', 1, FALSE, TRUE),
    ('Charlie', 'Brown', 'admin', 2, TRUE, TRUE),
    ('David', 'Lee', 'student', 2, TRUE, TRUE),
    ('Emma', 'Davis', 'coach', 3, FALSE, TRUE);

-- 🚀 journeys 테이블 Seed 데이터
INSERT INTO public.journeys (name, date_start, date_end, countries, image_url)
VALUES
    ('Full Stack Web Development Bootcamp', '2025-01-01', '2025-04-01', 'USA, Canada', 'https://example.com/image1.jpg'),
    ('Digital Marketing Workshop', '2025-03-15', '2025-06-15', 'UK', 'https://example.com/image2.jpg'),
    ('AI Research Program', '2025-02-10', '2025-07-10', 'Germany, France', 'https://example.com/image3.jpg');

-- 🚀 user_journeys 테이블 Seed 데이터 (유저가 Journey 참여)
INSERT INTO public.user_journeys (user_id, journey_id, joined_at, role_in_journey)
VALUES
    (1, 1, '2025-01-01', 'student'),
    (2, 1, '2025-01-01', 'teacher'),
    (3, 2, '2025-03-15', 'admin'),
    (4, 2, '2025-03-16', 'student'),
    (5, 3, '2025-02-10', 'coach');

-- 🚀 journey_weeks 테이블 Seed 데이터 (각 Journey의 주차 정보)
INSERT INTO public.journey_weeks (journey_id, name, week_number)
VALUES
    (1, 'Week 1 - HTML Basics', 1),
    (1, 'Week 2 - CSS & Layouts', 2),
    (1, 'Week 3 - JavaScript Fundamentals', 3),
    (2, 'Week 1 - Social Media Marketing', 1),
    (2, 'Week 2 - SEO Optimization', 2),
    (3, 'Week 1 - Introduction to AI', 1);

-- 🚀 missions 테이블 Seed 데이터 (각 주차에 미션 할당)
INSERT INTO public.missions (journey_week_id, name, mission_type, points, description, release_date, expiry_date)
VALUES
    (1, 'Build a Simple Webpage', 'Coding', 100, 'Create a basic webpage using HTML.', '2025-01-02', '2025-01-10'),
    (2, 'Create a Responsive Layout', 'Design', 150, 'Use CSS to create a responsive web layout.', '2025-01-09', '2025-01-17'),
    (3, 'JavaScript Calculator', 'Coding', 200, 'Build a simple calculator using JavaScript.', '2025-01-16', '2025-01-24'),
    (4, 'Run a Facebook Ad Campaign', 'Marketing', 100, 'Set up an ad campaign on Facebook.', '2025-03-16', '2025-03-25'),
    (5, 'SEO Audit Report', 'Research', 150, 'Conduct an SEO audit for a website.', '2025-03-24', '2025-04-01'),
    (6, 'Train a Machine Learning Model', 'AI', 200, 'Use Python to train a simple AI model.', '2025-02-12', '2025-02-20');

-- 🚀 submissions 테이블 Seed 데이터 (미션에 대한 학생 제출)
INSERT INTO public.submissions (mission_id, user_id, content, attachment_url, submitted_at, score)
VALUES
    (1, 1, 'Completed basic HTML webpage.', 'https://example.com/html_project.jpg', '2025-01-05', 95),
    (2, 1, 'Created a responsive CSS layout.', 'https://example.com/css_layout.png', '2025-01-12', 88),
    (3, 1, 'Built a working calculator with JavaScript.', 'https://example.com/js_calculator.mp4', '2025-01-20', 92),
    (4, 4, 'Facebook ad campaign analysis report.', 'https://example.com/facebook_report.pdf', '2025-03-20', 90),
    (5, 4, 'SEO audit report for e-commerce site.', 'https://example.com/seo_audit.docx', '2025-03-30', 85),
    (6, 5, 'Trained an AI model using TensorFlow.', 'https://example.com/ai_model.png', '2025-02-18', 97);

-- 🚀 comments 테이블 Seed 데이터 (제출물에 댓글)
INSERT INTO public.comments (submission_id, user_id, content)
VALUES
    (1, 2, 'Great job on the HTML structure!'),
    (2, 3, 'Nice work on the responsive layout.'),
    (3, 2, 'Impressive calculator! Well done.'),
    (4, 5, 'Good analysis of the ad campaign.'),
    (5, 3, 'Your SEO insights are valuable.'),
    (6, 1, 'AI model looks promising!');

-- 🚀 likes 테이블 Seed 데이터 (제출물에 좋아요)
INSERT INTO public.likes (submission_id, user_id)
VALUES
    (1, 3), (2, 4), (3, 5),
    (4, 2), (5, 1), (6, 3);

-- 🚀 bug_reports 테이블 Seed 데이터 (유저가 버그 제출)
INSERT INTO public.bug_reports (user_id, title, description, status)
VALUES
    (1, 'Login issue on mobile', 'Cannot log in from iOS devices.', 'open'),
    (2, 'Image upload error', 'Profile picture upload fails sometimes.', 'in_progress'),
    (3, 'Broken link in dashboard', 'The help center link is not working.', 'resolved');