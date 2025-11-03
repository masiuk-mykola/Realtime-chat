'use server';

import z from 'zod';
import { createRoomSchema } from '../schemas/rooms';
import { getCurrentUser } from '../lib/getCurrentUser';
import { createClient } from '../server';

export default async function createRoom(unsafeData: z.infer<typeof createRoomSchema>) {
  const { success, data } = createRoomSchema.safeParse(unsafeData);

  if (!success) return { error: true, message: 'Invalid room data' };

  const user = await getCurrentUser();

  if (user == null) return { error: true, message: 'User not authenticated' };

  const supabase = await createClient();
  supabase
    .from('chat_room')
    .insert({
      name: data.name,
      is_public: data.isPublic,
    })
    .select('id')
    .single();
}
