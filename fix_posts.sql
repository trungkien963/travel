-- 1. Enable Realtime Broadcasting
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 2. Convert Data Types to JSONB for correct WebSockets Javascript Parsing
-- Chuyển đổi an toàn từ TEXT[] sang JSONB
ALTER TABLE public.posts ALTER COLUMN likes TYPE jsonb USING array_to_json(likes)::jsonb;
ALTER TABLE public.posts ALTER COLUMN image_urls TYPE jsonb USING array_to_json(image_urls)::jsonb;

-- Đảm bảo comments là jsonb
ALTER TABLE public.posts ALTER COLUMN comments TYPE jsonb USING comments::jsonb;

-- Set default values cho an toàn future inserts
ALTER TABLE public.posts ALTER COLUMN likes SET DEFAULT '[]'::jsonb;
ALTER TABLE public.posts ALTER COLUMN image_urls SET DEFAULT '[]'::jsonb;
ALTER TABLE public.posts ALTER COLUMN comments SET DEFAULT '[]'::jsonb;

-- 3. Update the Functions for JSONB compatibility
CREATE OR REPLACE FUNCTION public.toggle_post_like(p_post_id UUID, p_user_id TEXT)
RETURNS void AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.posts WHERE id = p_post_id AND likes @> jsonb_build_array(p_user_id)) THEN
    UPDATE public.posts SET likes = likes - p_user_id WHERE id = p_post_id;
  ELSE
    UPDATE public.posts SET likes = likes || jsonb_build_array(p_user_id) WHERE id = p_post_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION public.trigger_post_updates_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    actor_name TEXT;
    actor_avatar TEXT;
    last_comment jsonb;
    comment_author_id UUID;
    action_user_id UUID;
BEGIN
    action_user_id := auth.uid(); 

    -- Trường hợp 1: Có người rớt Tym (So sánh độ dài JSONB Array likes)
    IF COALESCE(jsonb_array_length(NEW.likes), 0) > COALESCE(jsonb_array_length(OLD.likes), 0) THEN
        SELECT full_name, avatar_url INTO actor_name, actor_avatar FROM public.users WHERE id = action_user_id;
        
        -- Chỉ gửi nếu người thả tym không phải chủ bài đăng
        IF NEW.user_id != action_user_id AND action_user_id IS NOT NULL THEN
            INSERT INTO public.notifications (user_id, actor_name, actor_avatar, type, message, trip_id, post_id, is_read)
            VALUES (NEW.user_id, COALESCE(actor_name, 'Traveler'), actor_avatar, 'POST_LIKE', 'đã thích khoảnh khắc của bạn.', NEW.trip_id, NEW.id, false);
        END IF;
    END IF;

    -- Trường hợp 2: Có Bình Luận mới (So sánh độ dài JSONB Array comments)
    IF COALESCE(jsonb_array_length(NEW.comments), 0) > COALESCE(jsonb_array_length(OLD.comments), 0) THEN
        last_comment := NEW.comments->-1; 
        comment_author_id := (last_comment->>'authorId')::UUID;
        
        -- Chỉ gửi nếu người bình luận không phải chủ bài
        IF NEW.user_id != comment_author_id THEN
            INSERT INTO public.notifications (user_id, actor_name, actor_avatar, type, message, trip_id, post_id, is_read)
            VALUES (NEW.user_id, last_comment->>'authorName', last_comment->>'authorAvatar', 'POST_COMMENT', 'bình luận: "' || substring(last_comment->>'text' from 1 for 20) || '..."', NEW.trip_id, NEW.id, false);
        END IF;
    END IF;

    RETURN NEW;
END;
$function$
;
