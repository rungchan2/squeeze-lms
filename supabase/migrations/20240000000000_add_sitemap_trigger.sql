-- 사이트맵 상태 테이블 생성
CREATE TABLE IF NOT EXISTS sitemap_status (
  id SERIAL PRIMARY KEY,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  needs_update BOOLEAN DEFAULT false
);

-- 초기 레코드 삽입
INSERT INTO sitemap_status (needs_update) VALUES (false);

-- 사이트맵 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_sitemap_status()
RETURNS TRIGGER AS $$
BEGIN
  -- 사이트맵 상태 테이블 업데이트
  UPDATE sitemap_status 
  SET needs_update = true, 
      last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- journeys 테이블에 트리거 추가
DROP TRIGGER IF EXISTS journey_update_sitemap ON journeys;
CREATE TRIGGER journey_update_sitemap
AFTER INSERT OR UPDATE OR DELETE ON journeys
FOR EACH ROW EXECUTE FUNCTION update_sitemap_status();

-- posts 테이블에 트리거 추가
DROP TRIGGER IF EXISTS post_update_sitemap ON posts;
CREATE TRIGGER post_update_sitemap
AFTER INSERT OR UPDATE OR DELETE ON posts
FOR EACH ROW EXECUTE FUNCTION update_sitemap_status(); 