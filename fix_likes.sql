CREATE OR REPLACE FUNCTION toggle_post_like(p_post_id UUID, p_user_id TEXT)
RETURNS void AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.posts WHERE id = p_post_id AND likes @> to_jsonb(p_user_id)) THEN
    UPDATE public.posts 
    SET likes = (
      SELECT jsonb_agg(elem) 
      FROM jsonb_array_elements(likes) elem 
      WHERE elem::text != to_jsonb(p_user_id)::text
    )
    WHERE id = p_post_id;
    -- If it became null due to empty jsonb_agg, make it empty array
    UPDATE public.posts SET likes = '[]'::jsonb WHERE id = p_post_id AND likes IS NULL;
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

    -- Trường hợp 1: Có người rớt Tym
    IF COALESCE(jsonb_array_length(NEW.likes), 0) > COALESCE(jsonb_array_length(OLD.likes), 0) THEN
        SELECT full_name, avatar_url INTO actor_name, actor_avatar FROM public.users WHERE id = action_user_id;
        
        IF NEW.user_id != action_user_id AND action_user_id IS NOT NULL THEN
            INSERT INTO public.notifications (user_id, actor_name, actor_avatar, type, message, trip_id, post_id, is_read)
            VALUES (NEW.user_id, COALESCE(actor_name, 'Traveler'), actor_avatar, 'POST_LIKE', 'đã thích khoảnh khắc của bạn.', NEW.trip_id, NEW.id, false);
        END IF;
    END IF;

    -- Trường hợp 2: Có Bình Luận mới
    IF COALESCE(jsonb_array_length(NEW.comments), 0) > COALESCE(jsonb_array_length(OLD.comments), 0) THEN
        last_comment := NEW.comments->-1;
        comment_author_id := (last_comment->>'authorId')::UUID;
        
        IF NEW.user_id != comment_author_id THEN
            INSERT INTO public.notifications (user_id, actor_name, actor_avatar, type, message, trip_id, post_id, is_read)
            VALUES (NEW.user_id, last_comment->>'authorName', last_comment->>'authorAvatar', 'POST_COMMENT', 'bình luận: "' || substring(last_comment->>'text' from 1 for 20) || '..."', NEW.trip_id, NEW.id, false);
        END IF;
    END IF;

    RETURN NEW;
END;
$function$
;
