create extension if not exists "pg_cron" with schema "pg_catalog";

create type "public"."expense_type" as enum ('FOOD', 'TRANSPORT', 'HOTEL', 'ACTIVITIES', 'SHOPPING', 'OTHER');


  create table "public"."expenses" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "trip_id" uuid,
    "payer_id" uuid,
    "amount" numeric not null,
    "description" text not null,
    "category" public.expense_type default 'OTHER'::public.expense_type,
    "receipt_url" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "splits" jsonb default '{}'::jsonb,
    "receipt_urls" text[] default '{}'::text[]
      );


alter table "public"."expenses" enable row level security;


  create table "public"."notifications" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "actor_name" text not null,
    "actor_avatar" text,
    "type" text not null,
    "message" text not null,
    "trip_id" uuid,
    "post_id" uuid,
    "expense_id" uuid,
    "is_read" boolean default false,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."notifications" enable row level security;


  create table "public"."posts" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "trip_id" uuid,
    "user_id" uuid,
    "content" text,
    "image_urls" text[] default '{}'::text[],
    "is_dual_camera" boolean default false,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "location_name" text,
    "location_city" text,
    "comments" jsonb default '[]'::jsonb,
    "likes" text[] default '{}'::text[]
      );


alter table "public"."posts" enable row level security;


  create table "public"."trip_members" (
    "trip_id" uuid not null,
    "user_id" uuid not null,
    "joined_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."trip_members" enable row level security;


  create table "public"."trips" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "title" text not null,
    "cover_image" text,
    "start_date" date,
    "end_date" date,
    "owner_id" uuid,
    "is_private" boolean default true,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "location_name" text,
    "location_city" text,
    "members" jsonb default '[]'::jsonb
      );


alter table "public"."trips" enable row level security;


  create table "public"."users" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "email" text not null,
    "full_name" text,
    "avatar_url" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "expo_push_token" text
      );


alter table "public"."users" enable row level security;

CREATE UNIQUE INDEX expenses_pkey ON public.expenses USING btree (id);

CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);

CREATE UNIQUE INDEX posts_pkey ON public.posts USING btree (id);

CREATE UNIQUE INDEX trip_members_pkey ON public.trip_members USING btree (trip_id, user_id);

CREATE UNIQUE INDEX trips_pkey ON public.trips USING btree (id);

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

alter table "public"."expenses" add constraint "expenses_pkey" PRIMARY KEY using index "expenses_pkey";

alter table "public"."notifications" add constraint "notifications_pkey" PRIMARY KEY using index "notifications_pkey";

alter table "public"."posts" add constraint "posts_pkey" PRIMARY KEY using index "posts_pkey";

alter table "public"."trip_members" add constraint "trip_members_pkey" PRIMARY KEY using index "trip_members_pkey";

alter table "public"."trips" add constraint "trips_pkey" PRIMARY KEY using index "trips_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."expenses" add constraint "expenses_payer_id_fkey" FOREIGN KEY (payer_id) REFERENCES public.users(id) not valid;

alter table "public"."expenses" validate constraint "expenses_payer_id_fkey";

alter table "public"."expenses" add constraint "expenses_trip_id_fkey" FOREIGN KEY (trip_id) REFERENCES public.trips(id) ON DELETE CASCADE not valid;

alter table "public"."expenses" validate constraint "expenses_trip_id_fkey";

alter table "public"."notifications" add constraint "notifications_expense_id_fkey" FOREIGN KEY (expense_id) REFERENCES public.expenses(id) ON DELETE CASCADE not valid;

alter table "public"."notifications" validate constraint "notifications_expense_id_fkey";

alter table "public"."posts" add constraint "posts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) not valid;

alter table "public"."posts" validate constraint "posts_user_id_fkey";

alter table "public"."posts" add constraint "posts_trip_id_fkey" FOREIGN KEY (trip_id) REFERENCES public.trips(id) ON DELETE CASCADE not valid;

alter table "public"."posts" validate constraint "posts_trip_id_fkey";

alter table "public"."trip_members" add constraint "trip_members_trip_id_fkey" FOREIGN KEY (trip_id) REFERENCES public.trips(id) ON DELETE CASCADE not valid;

alter table "public"."trip_members" validate constraint "trip_members_trip_id_fkey";

alter table "public"."trip_members" add constraint "trip_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."trip_members" validate constraint "trip_members_user_id_fkey";

alter table "public"."trips" add constraint "trips_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."trips" validate constraint "trips_owner_id_fkey";

alter table "public"."users" add constraint "users_email_key" UNIQUE using index "users_email_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.add_post_comment(p_post_id uuid, p_comment jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.posts 
  SET comments = comments || jsonb_build_array(p_comment) 
  WHERE id = p_post_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.delete_storage_object(file_url text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  obj_path TEXT;
BEGIN
  IF file_url LIKE '%/nomadsync-media/%' THEN
    -- Bóc tách lấy đúng tên đường dẫn Object
    obj_path := split_part(file_url, '/nomadsync-media/', 2);
    -- Chém bay object khỏi S3 (Thông qua table logic của Supabase)
    DELETE FROM storage.objects WHERE bucket_id = 'nomadsync-media' AND name = obj_path;
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_expense_deletion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  url TEXT;
BEGIN
  IF old.receipt_urls IS NOT NULL THEN
    FOREACH url IN ARRAY old.receipt_urls LOOP
      PERFORM public.delete_storage_object(url);
    END LOOP;
  END IF;
  RETURN old;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', null)
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url;
  RETURN new;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_post_deletion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  url TEXT;
BEGIN
  -- Quét xóa sạch mảng hình ảnh
  IF old.image_urls IS NOT NULL THEN
    FOREACH url IN ARRAY old.image_urls LOOP
      PERFORM public.delete_storage_object(url);
    END LOOP;
  END IF;
  RETURN old;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_trip_deletion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF old.cover_image IS NOT NULL THEN
    PERFORM public.delete_storage_object(old.cover_image);
  END IF;
  RETURN old;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.toggle_post_like(p_post_id uuid, p_user_id text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF EXISTS (SELECT 1 FROM public.posts WHERE id = p_post_id AND p_user_id = ANY(likes)) THEN
    UPDATE public.posts SET likes = array_remove(likes, p_user_id) WHERE id = p_post_id;
  ELSE
    UPDATE public.posts SET likes = array_append(likes, p_user_id) WHERE id = p_post_id;
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_new_expense_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    trip_members jsonb;
    member_elem jsonb;
    actor_name TEXT;
    actor_avatar TEXT;
    target_user_id UUID;
BEGIN
    SELECT full_name, avatar_url INTO actor_name, actor_avatar FROM public.users WHERE id = NEW.payer_id;
    SELECT coalesce(members, '[]'::jsonb) INTO trip_members FROM public.trips WHERE id = NEW.trip_id;

    IF trip_members IS NOT NULL THEN
        FOR member_elem IN SELECT * FROM jsonb_array_elements(trip_members)
        LOOP
            target_user_id := (member_elem->>'id')::UUID;
            IF target_user_id != NEW.payer_id THEN
                INSERT INTO public.notifications (user_id, actor_name, actor_avatar, type, message, trip_id, expense_id, is_read)
                VALUES (target_user_id, COALESCE(actor_name, 'Traveler'), actor_avatar, 'EXPENSE_ADDED', 'vừa thêm hóa đơn: ' || COALESCE(NEW.description, '') || ' - $' || NEW.amount, NEW.trip_id, NEW.id, false);
            END IF;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_new_post_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    trip_members jsonb;
    member_elem jsonb;
    actor_name TEXT;
    actor_avatar TEXT;
    target_user_id UUID;
BEGIN
    -- Lấy thông tin người đăng (actor)
    SELECT full_name, avatar_url INTO actor_name, actor_avatar FROM public.users WHERE id = NEW.user_id;
    -- Lấy danh sách thành viên của chuyến đi
    SELECT coalesce(members, '[]'::jsonb) INTO trip_members FROM public.trips WHERE id = NEW.trip_id;

    -- Bắn thông báo cho từng thành viên (Trừ người đăng)
    IF trip_members IS NOT NULL THEN
        FOR member_elem IN SELECT * FROM jsonb_array_elements(trip_members)
        LOOP
            target_user_id := (member_elem->>'id')::UUID;
            IF target_user_id != NEW.user_id THEN
                INSERT INTO public.notifications (user_id, actor_name, actor_avatar, type, message, trip_id, post_id, is_read)
                VALUES (target_user_id, COALESCE(actor_name, 'Traveler'), actor_avatar, 'POST_NEW', 'vừa thêm một khoảnh khắc mới.', NEW.trip_id, NEW.id, false);
            END IF;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_new_trip_invite()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    member_elem jsonb;
    target_user_id UUID;
    actor_name TEXT;
    actor_avatar TEXT;
    target_email TEXT;
BEGIN
    -- Lấy thông tin người chủ (owner)
    SELECT full_name, avatar_url INTO actor_name, actor_avatar FROM public.users WHERE id = NEW.owner_id;

    -- Quét qua danh sách email/thành viên được mời vào Trip
    IF NEW.members IS NOT NULL THEN
        FOR member_elem IN SELECT * FROM jsonb_array_elements(NEW.members)
        LOOP
            target_email := member_elem->>'email';

            -- Tìm kiếm ID thực tế của người dùng dựa trên Email họ nhập vào
            IF target_email IS NOT NULL THEN
                SELECT id INTO target_user_id FROM public.users WHERE email = target_email LIMIT 1;
                
                -- Nếu tìm thấy thành viên đó đã xài App và ID tải về khác với thằng Owner
                IF target_user_id IS NOT NULL AND target_user_id != NEW.owner_id THEN
                    INSERT INTO public.notifications (user_id, actor_name, actor_avatar, type, message, trip_id, is_read)
                    VALUES (target_user_id, COALESCE(actor_name, 'Traveler'), actor_avatar, 'TRIP_INVITE', 'đã mời bạn tham gia chuyến đi: ' || NEW.title, NEW.id, false);
                END IF;
            END IF;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$function$
;

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
    action_user_id := auth.uid(); -- Lấy ID của người đang chọt Like/Comment

    -- Trường hợp 1: Có người rớt Tym (NEW.likes > OLD.likes)
    IF NEW.likes > COALESCE(OLD.likes, 0) THEN
        SELECT full_name, avatar_url INTO actor_name, actor_avatar FROM public.users WHERE id = action_user_id;
        
        -- Chỉ gửi nếu người thả tym không phải chủ bài đăng
        IF NEW.user_id != action_user_id AND action_user_id IS NOT NULL THEN
            INSERT INTO public.notifications (user_id, actor_name, actor_avatar, type, message, trip_id, post_id, is_read)
            VALUES (NEW.user_id, COALESCE(actor_name, 'Traveler'), actor_avatar, 'POST_LIKE', 'đã thích khoảnh khắc của bạn.', NEW.trip_id, NEW.id, false);
        END IF;
    END IF;

    -- Trường hợp 2: Có Bình Luận mới (So sánh độ dài chuỗi Array Comments)
    IF COALESCE(jsonb_array_length(NEW.comments), 0) > COALESCE(jsonb_array_length(OLD.comments), 0) THEN
        last_comment := NEW.comments->-1; -- Lấy object bình luận cuối cùng vừa nạp
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

CREATE OR REPLACE FUNCTION public.trigger_update_trip_invite()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    target_email TEXT;
    target_user_id UUID;
    actor_name TEXT;
    actor_avatar TEXT;
BEGIN
    -- Lấy thông tin người chủ mưu (Kẻ vừa ấn nút Add)
    SELECT full_name, avatar_url INTO actor_name, actor_avatar FROM public.users WHERE id = auth.uid();

    -- Thuật toán so sánh: Lấy toàn bộ [Email Mới] TRỪ ĐI toàn bộ [Email Cũ]
    -- Kết quả sẽ chỉ lòi ra ròng rã những Email vừa mới được gõ vào form chưa ráo mực!
    FOR target_email IN 
        SELECT value->>'email' FROM jsonb_array_elements(NEW.members)
        EXCEPT
        SELECT value->>'email' FROM jsonb_array_elements(COALESCE(OLD.members, '[]'::jsonb))
    LOOP
        IF target_email IS NOT NULL THEN
            -- Tìm kiếm ID thực sự từ hệ thống Supabase
            SELECT id INTO target_user_id FROM public.users WHERE email = target_email LIMIT 1;
            
            -- Tránh bắn thông báo tự kỉ (Tự add bản thân xong tự hiện)
            IF target_user_id IS NOT NULL AND target_user_id != auth.uid() THEN
                INSERT INTO public.notifications (user_id, actor_name, actor_avatar, type, message, trip_id, is_read)
                VALUES (target_user_id, COALESCE(actor_name, 'Traveler'), actor_avatar, 'TRIP_INVITE', 'đã thêm bạn vào chuyến đi: ' || NEW.title, NEW.id, false);
            END IF;
        END IF;
    END LOOP;

    RETURN NEW;
END;
$function$
;

grant delete on table "public"."expenses" to "anon";

grant insert on table "public"."expenses" to "anon";

grant references on table "public"."expenses" to "anon";

grant select on table "public"."expenses" to "anon";

grant trigger on table "public"."expenses" to "anon";

grant truncate on table "public"."expenses" to "anon";

grant update on table "public"."expenses" to "anon";

grant delete on table "public"."expenses" to "authenticated";

grant insert on table "public"."expenses" to "authenticated";

grant references on table "public"."expenses" to "authenticated";

grant select on table "public"."expenses" to "authenticated";

grant trigger on table "public"."expenses" to "authenticated";

grant truncate on table "public"."expenses" to "authenticated";

grant update on table "public"."expenses" to "authenticated";

grant delete on table "public"."expenses" to "service_role";

grant insert on table "public"."expenses" to "service_role";

grant references on table "public"."expenses" to "service_role";

grant select on table "public"."expenses" to "service_role";

grant trigger on table "public"."expenses" to "service_role";

grant truncate on table "public"."expenses" to "service_role";

grant update on table "public"."expenses" to "service_role";

grant delete on table "public"."notifications" to "anon";

grant insert on table "public"."notifications" to "anon";

grant references on table "public"."notifications" to "anon";

grant select on table "public"."notifications" to "anon";

grant trigger on table "public"."notifications" to "anon";

grant truncate on table "public"."notifications" to "anon";

grant update on table "public"."notifications" to "anon";

grant delete on table "public"."notifications" to "authenticated";

grant insert on table "public"."notifications" to "authenticated";

grant references on table "public"."notifications" to "authenticated";

grant select on table "public"."notifications" to "authenticated";

grant trigger on table "public"."notifications" to "authenticated";

grant truncate on table "public"."notifications" to "authenticated";

grant update on table "public"."notifications" to "authenticated";

grant delete on table "public"."notifications" to "service_role";

grant insert on table "public"."notifications" to "service_role";

grant references on table "public"."notifications" to "service_role";

grant select on table "public"."notifications" to "service_role";

grant trigger on table "public"."notifications" to "service_role";

grant truncate on table "public"."notifications" to "service_role";

grant update on table "public"."notifications" to "service_role";

grant delete on table "public"."posts" to "anon";

grant insert on table "public"."posts" to "anon";

grant references on table "public"."posts" to "anon";

grant select on table "public"."posts" to "anon";

grant trigger on table "public"."posts" to "anon";

grant truncate on table "public"."posts" to "anon";

grant update on table "public"."posts" to "anon";

grant delete on table "public"."posts" to "authenticated";

grant insert on table "public"."posts" to "authenticated";

grant references on table "public"."posts" to "authenticated";

grant select on table "public"."posts" to "authenticated";

grant trigger on table "public"."posts" to "authenticated";

grant truncate on table "public"."posts" to "authenticated";

grant update on table "public"."posts" to "authenticated";

grant delete on table "public"."posts" to "service_role";

grant insert on table "public"."posts" to "service_role";

grant references on table "public"."posts" to "service_role";

grant select on table "public"."posts" to "service_role";

grant trigger on table "public"."posts" to "service_role";

grant truncate on table "public"."posts" to "service_role";

grant update on table "public"."posts" to "service_role";

grant delete on table "public"."trip_members" to "anon";

grant insert on table "public"."trip_members" to "anon";

grant references on table "public"."trip_members" to "anon";

grant select on table "public"."trip_members" to "anon";

grant trigger on table "public"."trip_members" to "anon";

grant truncate on table "public"."trip_members" to "anon";

grant update on table "public"."trip_members" to "anon";

grant delete on table "public"."trip_members" to "authenticated";

grant insert on table "public"."trip_members" to "authenticated";

grant references on table "public"."trip_members" to "authenticated";

grant select on table "public"."trip_members" to "authenticated";

grant trigger on table "public"."trip_members" to "authenticated";

grant truncate on table "public"."trip_members" to "authenticated";

grant update on table "public"."trip_members" to "authenticated";

grant delete on table "public"."trip_members" to "service_role";

grant insert on table "public"."trip_members" to "service_role";

grant references on table "public"."trip_members" to "service_role";

grant select on table "public"."trip_members" to "service_role";

grant trigger on table "public"."trip_members" to "service_role";

grant truncate on table "public"."trip_members" to "service_role";

grant update on table "public"."trip_members" to "service_role";

grant delete on table "public"."trips" to "anon";

grant insert on table "public"."trips" to "anon";

grant references on table "public"."trips" to "anon";

grant select on table "public"."trips" to "anon";

grant trigger on table "public"."trips" to "anon";

grant truncate on table "public"."trips" to "anon";

grant update on table "public"."trips" to "anon";

grant delete on table "public"."trips" to "authenticated";

grant insert on table "public"."trips" to "authenticated";

grant references on table "public"."trips" to "authenticated";

grant select on table "public"."trips" to "authenticated";

grant trigger on table "public"."trips" to "authenticated";

grant truncate on table "public"."trips" to "authenticated";

grant update on table "public"."trips" to "authenticated";

grant delete on table "public"."trips" to "service_role";

grant insert on table "public"."trips" to "service_role";

grant references on table "public"."trips" to "service_role";

grant select on table "public"."trips" to "service_role";

grant trigger on table "public"."trips" to "service_role";

grant truncate on table "public"."trips" to "service_role";

grant update on table "public"."trips" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";


  create policy "Allow test bypass expenses"
  on "public"."expenses"
  as permissive
  for all
  to public
using (true);



  create policy "Members can mutate expenses"
  on "public"."expenses"
  as permissive
  for all
  to public
using ((trip_id IN ( SELECT trips.id
   FROM public.trips
  WHERE ((trips.owner_id = auth.uid()) OR (trips.members @> jsonb_build_array(jsonb_build_object('id', auth.uid())))))));



  create policy "Members can view expenses of their trips"
  on "public"."expenses"
  as permissive
  for select
  to public
using ((trip_id IN ( SELECT trips.id
   FROM public.trips
  WHERE ((trips.owner_id = auth.uid()) OR (trips.members @> jsonb_build_array(jsonb_build_object('id', auth.uid())))))));



  create policy "Users can insert notifications"
  on "public"."notifications"
  as permissive
  for insert
  to public
with check ((auth.role() = 'authenticated'::text));



  create policy "Users can update their own notifications"
  on "public"."notifications"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Users can view their own notifications"
  on "public"."notifications"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users view own notifications"
  on "public"."notifications"
  as permissive
  for all
  to public
using ((user_id = auth.uid()));



  create policy "Allow test bypass posts"
  on "public"."posts"
  as permissive
  for all
  to public
using (true);



  create policy "Members can mutate posts"
  on "public"."posts"
  as permissive
  for all
  to public
using ((trip_id IN ( SELECT trips.id
   FROM public.trips
  WHERE ((trips.owner_id = auth.uid()) OR (trips.members @> jsonb_build_array(jsonb_build_object('id', auth.uid())))))));



  create policy "Members can view posts of their trips"
  on "public"."posts"
  as permissive
  for select
  to public
using ((trip_id IN ( SELECT trips.id
   FROM public.trips
  WHERE ((trips.owner_id = auth.uid()) OR (trips.members @> jsonb_build_array(jsonb_build_object('id', auth.uid())))))));



  create policy "Allow test bypass members"
  on "public"."trip_members"
  as permissive
  for all
  to public
using (true);



  create policy "Allow test bypass trips"
  on "public"."trips"
  as permissive
  for all
  to public
using (true);



  create policy "Members can update their trips"
  on "public"."trips"
  as permissive
  for update
  to public
using (((owner_id = auth.uid()) OR (members @> jsonb_build_array(jsonb_build_object('id', auth.uid())))));



  create policy "Only trip owner can delete trip"
  on "public"."trips"
  as permissive
  for delete
  to public
using ((owner_id = auth.uid()));



  create policy "Users can insert trips"
  on "public"."trips"
  as permissive
  for insert
  to public
with check ((auth.uid() IS NOT NULL));



  create policy "Users view trips they belong to"
  on "public"."trips"
  as permissive
  for select
  to public
using (((owner_id = auth.uid()) OR (members @> jsonb_build_array(jsonb_build_object('id', auth.uid())))));



  create policy "Allow test bypass users"
  on "public"."users"
  as permissive
  for all
  to public
using (true);



  create policy "Enable read access for all users"
  on "public"."users"
  as permissive
  for select
  to public
using (true);



  create policy "Users can edit their own profile"
  on "public"."users"
  as permissive
  for update
  to public
using ((auth.uid() = id));


CREATE TRIGGER on_expense_created AFTER INSERT ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.trigger_new_expense_notification();

CREATE TRIGGER on_expense_deleted AFTER DELETE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.handle_expense_deletion();

CREATE TRIGGER "Bắn_Thông_Báo_Tới_ĐT" AFTER INSERT ON public.notifications FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('https://wjyftbudktqqxuxvnjpe.supabase.co/functions/v1/send-push-notification', 'POST', '{"Content-type":"application/json"}', '{}', '5000');

CREATE TRIGGER on_post_created AFTER INSERT ON public.posts FOR EACH ROW EXECUTE FUNCTION public.trigger_new_post_notification();

CREATE TRIGGER on_post_deleted AFTER DELETE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.handle_post_deletion();

CREATE TRIGGER on_post_updated AFTER UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.trigger_post_updates_notification();

CREATE TRIGGER on_trip_created AFTER INSERT ON public.trips FOR EACH ROW EXECUTE FUNCTION public.trigger_new_trip_invite();

CREATE TRIGGER on_trip_deleted AFTER DELETE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.handle_trip_deletion();

CREATE TRIGGER on_trip_updated_members AFTER UPDATE ON public.trips FOR EACH ROW WHEN ((new.members IS DISTINCT FROM old.members)) EXECUTE FUNCTION public.trigger_update_trip_invite();

CREATE TRIGGER on_auth_user_created AFTER INSERT OR UPDATE ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "Public Access"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'nomadsync-media'::text));



  create policy "Public Upload"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check ((bucket_id = 'nomadsync-media'::text));



