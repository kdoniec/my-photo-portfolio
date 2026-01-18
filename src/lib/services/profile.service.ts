import type { SupabaseClient } from "../../db/supabase.client";
import type { ProfileDTO, UpdateProfileCommand } from "../../types";

export class ProfileService {
  constructor(private supabase: SupabaseClient) {}

  async getProfile(userId: string): Promise<ProfileDTO | null> {
    const { data, error } = await this.supabase.from("profiles").select("*").eq("id", userId).single();

    if (error) {
      // PGRST116 = Row not found
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }

    return data;
  }

  async updateProfile(userId: string, command: UpdateProfileCommand): Promise<ProfileDTO> {
    const { data, error } = await this.supabase
      .from("profiles")
      .update({
        display_name: command.display_name,
        bio: command.bio ?? null,
        contact_email: command.contact_email ?? null,
        contact_phone: command.contact_phone ?? null,
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }
}
