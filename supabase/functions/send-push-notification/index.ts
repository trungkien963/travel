import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const payload = await req.json()
    // payload.record chứa dòng thông báo vừa mới chui vào DB
    const { user_id, message, actor_name, type, trip_id } = payload.record

    if (!user_id) return new Response("No user_id provided", { status: 200 })

    // Khởi tạo Supabase Client cấp quyền Admin
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Truy tìm người dùng cần nhận thông báo để lấy Mã Push Token
    const { data: user } = await supabase
      .from('users')
      .select('expo_push_token')
      .eq('id', user_id)
      .single()

    if (!user || !user.expo_push_token) {
      return new Response("User has no Expo Push Token", { status: 200 })
    }

    // Tự sinh cái Title tiếng việt dựa vào mã type cho đẹp
    let title = "WanderPool"
    if (type === 'POST_LIKE') title = "Có người thả tym ♥️"
    if (type === 'POST_COMMENT') title = "Có bình luận mới 💬"
    if (type === 'EXPENSE_ADDED') title = "Có bill mới vừa thêm 💸"
    if (type === 'POST_NEW') title = "Khoảnh khắc mới ✨"

    // Chuyền thẳng quả bóng cho máy chủ cực mạnh của Expo để bắn vào ĐT!
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: user.expo_push_token,
        sound: 'default',
        title: title,
        body: `${actor_name} ${message}`,
        data: { tripId: trip_id }
      }),
    })

    return new Response("Notification dispatched via Expo", { status: 200 })
  } catch (err) {
    return new Response(String(err?.message ?? err), { status: 500 })
  }
})
