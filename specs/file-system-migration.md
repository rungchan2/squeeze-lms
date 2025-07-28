-- =====================================================
-- 간단한 중앙집중식 파일 관리 시스템
-- =====================================================

-- 📊 현재 파일 URL 사용 위치 분석:
-- 1. profiles.profile_image - 프로필 이미지
-- 2. journeys.image_url - 저니 대표 이미지  
-- 3. blog.image_url - 블로그 포스트 이미지
-- 4. posts.file_url - 게시물 첨부 파일
-- 5. posts.answers_data->answers->image_urls[] - 답변 이미지들
-- 6. bug_reports.file_url - 버그 리포트 첨부 파일

-- =====================================================
-- 1단계: 간단한 Files 테이블 생성
-- =====================================================

-- 파일 타입 ENUM 생성
CREATE TYPE file_type AS ENUM (
    'image',        -- 이미지 파일 (jpg, png, gif, etc.)
    'file'          -- 일반 파일 (pdf, doc, zip, etc.)
);

-- Files 중앙 관리 테이블 생성
CREATE TABLE files (
    id SERIAL PRIMARY KEY,                    -- 간단한 정수 ID
    
    -- 파일 기본 정보
    original_name TEXT NOT NULL,             -- 원본 파일명
    url TEXT NOT NULL,                       -- Supabase Storage URL
    file_type file_type NOT NULL,            -- 파일 유형 (image/file)
    
    -- 파일 메타데이터
    file_size BIGINT,                        -- 파일 크기 (bytes)
    mime_type TEXT,                          -- MIME 타입 (image/jpeg, application/pdf, etc.)
    
    -- 업로드 정보
    uploaded_by UUID,                        -- 업로드한 사용자
    uploaded_at TIMESTAMPTZ DEFAULT now(),   -- 업로드 날짜
    
    -- 상태 관리
    is_active BOOLEAN DEFAULT true,          -- 활성 상태 (삭제 관리용)
    
    -- 외래키
    FOREIGN KEY (uploaded_by) REFERENCES profiles(id)
);

-- RLS 활성화
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- 인덱스 생성
CREATE INDEX idx_files_uploaded_by ON files(uploaded_by);
CREATE INDEX idx_files_file_type ON files(file_type);
CREATE INDEX idx_files_uploaded_at ON files(uploaded_at);
CREATE INDEX idx_files_is_active ON files(is_active);

-- =====================================================
-- 2단계: 기존 테이블에 file_id 임시 필드 추가
-- =====================================================

-- profiles 테이블에 file_id 추가 (profile_image 대체용)
ALTER TABLE profiles 
ADD COLUMN profile_image_file_id INTEGER,
ADD FOREIGN KEY (profile_image_file_id) REFERENCES files(id);

-- journeys 테이블에 file_id 추가 (image_url 대체용)
ALTER TABLE journeys 
ADD COLUMN image_file_id INTEGER,
ADD FOREIGN KEY (image_file_id) REFERENCES files(id);

-- blog 테이블에 file_id 추가 (image_url 대체용)
ALTER TABLE blog 
ADD COLUMN image_file_id INTEGER,
ADD FOREIGN KEY (image_file_id) REFERENCES files(id);

-- posts 테이블에 file_id 추가 (file_url 대체용)
ALTER TABLE posts 
ADD COLUMN attachment_file_id INTEGER,
ADD FOREIGN KEY (attachment_file_id) REFERENCES files(id);

-- bug_reports 테이블에 file_id 추가 (file_url 대체용)
ALTER TABLE bug_reports 
ADD COLUMN attachment_file_id INTEGER,
ADD FOREIGN KEY (attachment_file_id) REFERENCES files(id);

-- =====================================================
-- 3단계: 편의 함수들 생성
-- =====================================================

-- 파일 업로드 헬퍼 함수
CREATE OR REPLACE FUNCTION upload_file(
    p_original_name TEXT,
    p_url TEXT,
    p_file_type file_type,
    p_file_size BIGINT DEFAULT NULL,
    p_mime_type TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    new_file_id INTEGER;
BEGIN
    INSERT INTO files (
        original_name,
        url,
        file_type,
        file_size,
        mime_type,
        uploaded_by
    ) VALUES (
        p_original_name,
        p_url,
        p_file_type,
        p_file_size,
        p_mime_type,
        auth.uid()
    ) RETURNING id INTO new_file_id;
    
    RETURN new_file_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 파일 URL 조회 함수
CREATE OR REPLACE FUNCTION get_file_url(p_file_id INTEGER)
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT url 
        FROM files 
        WHERE id = p_file_id 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql;

-- 파일 정보 조회 함수
CREATE OR REPLACE FUNCTION get_file_info(p_file_id INTEGER)
RETURNS TABLE (
    id INTEGER,
    original_name TEXT,
    url TEXT,
    file_type file_type,
    file_size BIGINT,
    mime_type TEXT,
    uploaded_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.original_name,
        f.url,
        f.file_type,
        f.file_size,
        f.mime_type,
        f.uploaded_at
    FROM files f
    WHERE f.id = p_file_id 
    AND f.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4단계: 편리한 View 생성 (기존 필드와 새 필드 통합)
-- =====================================================

-- 프로필 정보 + 파일 정보 통합 View
CREATE VIEW profiles_with_files AS
SELECT 
    p.*,
    -- 기존 필드 유지
    p.profile_image as profile_image_url_old,
    -- 새로운 파일 시스템 정보
    f.url as profile_image_url_new,
    f.original_name as profile_image_name,
    f.file_size as profile_image_size,
    f.uploaded_at as profile_image_uploaded_at
FROM profiles p
LEFT JOIN files f ON p.profile_image_file_id = f.id AND f.is_active = true;

-- 저니 정보 + 파일 정보 통합 View
CREATE VIEW journeys_with_files AS
SELECT 
    j.*,
    -- 기존 필드 유지
    j.image_url as image_url_old,
    -- 새로운 파일 시스템 정보
    f.url as image_url_new,
    f.original_name as image_name,
    f.file_size as image_size,
    f.uploaded_at as image_uploaded_at
FROM journeys j
LEFT JOIN files f ON j.image_file_id = f.id AND f.is_active = true;

-- 블로그 정보 + 파일 정보 통합 View
CREATE VIEW blog_with_files AS
SELECT 
    b.*,
    -- 기존 필드 유지
    b.image_url as image_url_old,
    -- 새로운 파일 시스템 정보
    f.url as image_url_new,
    f.original_name as image_name,
    f.file_size as image_size,
    f.uploaded_at as image_uploaded_at
FROM blog b
LEFT JOIN files f ON b.image_file_id = f.id AND f.is_active = true;

-- 게시물 정보 + 파일 정보 통합 View
CREATE VIEW posts_with_files AS
SELECT 
    p.*,
    -- 기존 필드 유지
    p.file_url as file_url_old,
    -- 새로운 파일 시스템 정보
    f.url as file_url_new,
    f.original_name as attachment_name,
    f.file_type as attachment_type,
    f.file_size as attachment_size,
    f.uploaded_at as attachment_uploaded_at
FROM posts p
LEFT JOIN files f ON p.attachment_file_id = f.id AND f.is_active = true;

-- 버그 리포트 정보 + 파일 정보 통합 View
CREATE VIEW bug_reports_with_files AS
SELECT 
    br.*,
    -- 기존 필드 유지
    br.file_url as file_url_old,
    -- 새로운 파일 시스템 정보
    f.url as file_url_new,
    f.original_name as attachment_name,
    f.file_type as attachment_type,
    f.file_size as attachment_size,
    f.uploaded_at as attachment_uploaded_at
FROM bug_reports br
LEFT JOIN files f ON br.attachment_file_id = f.id AND f.is_active = true;

-- =====================================================
-- 5단계: RLS 정책 생성
-- =====================================================

-- Files 테이블 RLS 정책
CREATE POLICY "Users can view files" ON files
    FOR SELECT USING (
        uploaded_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('teacher', 'admin')
        )
    );

CREATE POLICY "Users can upload files" ON files
    FOR INSERT WITH CHECK (
        uploaded_by = auth.uid()
    );

CREATE POLICY "Users can update their own files" ON files
    FOR UPDATE USING (
        uploaded_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('teacher', 'admin')
        )
    );

-- =====================================================
-- 6단계: 마이그레이션 함수 (기존 URL → files 테이블)
-- =====================================================

-- 기존 URL들을 files 테이블로 마이그레이션하는 함수
CREATE OR REPLACE FUNCTION migrate_existing_urls_to_files()
RETURNS TABLE (
    table_name TEXT,
    migrated_count INTEGER
) AS $$
DECLARE
    profile_count INTEGER := 0;
    journey_count INTEGER := 0;
    blog_count INTEGER := 0;
    post_count INTEGER := 0;
    bug_count INTEGER := 0;
    rec RECORD;
    new_file_id INTEGER;
BEGIN
    -- 1. 프로필 이미지 마이그레이션
    FOR rec IN 
        SELECT id, profile_image 
        FROM profiles 
        WHERE profile_image IS NOT NULL 
        AND profile_image != ''
        AND profile_image_file_id IS NULL
    LOOP
        SELECT upload_file(
            'profile_image.jpg',
            rec.profile_image,
            'image'
        ) INTO new_file_id;
        
        UPDATE profiles 
        SET profile_image_file_id = new_file_id 
        WHERE id = rec.id;
        
        profile_count := profile_count + 1;
    END LOOP;
    
    -- 2. 저니 이미지 마이그레이션
    FOR rec IN 
        SELECT id, image_url 
        FROM journeys 
        WHERE image_url IS NOT NULL 
        AND image_url != ''
        AND image_file_id IS NULL
    LOOP
        SELECT upload_file(
            'journey_image.jpg',
            rec.image_url,
            'image'
        ) INTO new_file_id;
        
        UPDATE journeys 
        SET image_file_id = new_file_id 
        WHERE id = rec.id;
        
        journey_count := journey_count + 1;
    END LOOP;
    
    -- 3. 블로그 이미지 마이그레이션 (기본 placeholder 제외)
    FOR rec IN 
        SELECT id, image_url 
        FROM blog 
        WHERE image_url IS NOT NULL 
        AND image_url != ''
        AND image_url != 'https://picsum.photos/980/540'
        AND image_file_id IS NULL
    LOOP
        SELECT upload_file(
            'blog_image.jpg',
            rec.image_url,
            'image'
        ) INTO new_file_id;
        
        UPDATE blog 
        SET image_file_id = new_file_id 
        WHERE id = rec.id;
        
        blog_count := blog_count + 1;
    END LOOP;
    
    -- 4. 게시물 파일 마이그레이션
    FOR rec IN 
        SELECT id, file_url 
        FROM posts 
        WHERE file_url IS NOT NULL 
        AND file_url != ''
        AND attachment_file_id IS NULL
    LOOP
        SELECT upload_file(
            'attachment',
            rec.file_url,
            'file'
        ) INTO new_file_id;
        
        UPDATE posts 
        SET attachment_file_id = new_file_id 
        WHERE id = rec.id;
        
        post_count := post_count + 1;
    END LOOP;
    
    -- 5. 버그 리포트 파일 마이그레이션
    FOR rec IN 
        SELECT id, file_url 
        FROM bug_reports 
        WHERE file_url IS NOT NULL 
        AND file_url != ''
        AND attachment_file_id IS NULL
    LOOP
        SELECT upload_file(
            'bug_screenshot.jpg',
            rec.file_url,
            'image'
        ) INTO new_file_id;
        
        UPDATE bug_reports 
        SET attachment_file_id = new_file_id 
        WHERE id = rec.id;
        
        bug_count := bug_count + 1;
    END LOOP;
    
    -- 결과 반환
    RETURN QUERY VALUES 
        ('profiles', profile_count),
        ('journeys', journey_count),
        ('blog', blog_count),
        ('posts', post_count),
        ('bug_reports', bug_count);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7단계: 유틸리티 함수들
-- =====================================================

-- 파일 사용량 통계
CREATE OR REPLACE FUNCTION get_file_stats()
RETURNS TABLE (
    file_type file_type,
    file_count BIGINT,
    total_size_mb NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.file_type,
        COUNT(*) as file_count,
        ROUND(SUM(f.file_size) / 1024.0 / 1024.0, 2) as total_size_mb
    FROM files f
    WHERE f.is_active = true
    GROUP BY f.file_type
    ORDER BY file_count DESC;
END;
$$ LANGUAGE plpgsql;

-- 사용자별 파일 사용량
CREATE OR REPLACE FUNCTION get_user_file_usage(p_user_id UUID)
RETURNS TABLE (
    file_type file_type,
    file_count BIGINT,
    total_size_mb NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.file_type,
        COUNT(*) as file_count,
        ROUND(SUM(f.file_size) / 1024.0 / 1024.0, 2) as total_size_mb
    FROM files f
    WHERE f.uploaded_by = p_user_id 
    AND f.is_active = true
    GROUP BY f.file_type
    ORDER BY file_count DESC;
END;
$$ LANGUAGE plpgsql;

-- 파일 삭제 (소프트 삭제)
CREATE OR REPLACE FUNCTION delete_file(p_file_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE files 
    SET is_active = false 
    WHERE id = p_file_id 
    AND (uploaded_by = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('teacher', 'admin')
    ));
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 사용 예시
-- =====================================================

/*
-- 1. 새 파일 업로드
SELECT upload_file(
    'my-document.pdf',                -- 원본 파일명
    'https://supabase.co/storage/...',  -- Storage URL
    'file',                          -- 파일 타입
    1024000,                         -- 파일 크기 (bytes)
    'application/pdf'                -- MIME 타입
);

-- 2. 프로필 이미지 설정
UPDATE profiles 
SET profile_image_file_id = 123 
WHERE id = auth.uid();

-- 3. 파일 정보 조회
SELECT * FROM get_file_info(123);

-- 4. 기존 URL 마이그레이션
SELECT * FROM migrate_existing_urls_to_files();

-- 5. 파일 사용량 확인
SELECT * FROM get_file_stats();

-- 6. View를 통한 통합 조회
SELECT * FROM profiles_with_files WHERE id = auth.uid();
SELECT * FROM posts_with_files WHERE id = 'post-uuid';
*/