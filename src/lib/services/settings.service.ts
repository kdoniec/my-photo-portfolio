import type { SupabaseClient } from "../../db/supabase.client";
import type { SettingsDTO, UpdateSettingsCommand } from "../../types";

export class SettingsService {
  constructor(private supabase: SupabaseClient) {}

  async getSettings(userId: string): Promise<SettingsDTO | null> {
    const { data, error } = await this.supabase
      .from("photographer_settings")
      .select("*")
      .eq("photographer_id", userId)
      .single();

    if (error) {
      // PGRST116 = Row not found
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }

    return data;
  }

  async updateSettings(userId: string, command: UpdateSettingsCommand): Promise<SettingsDTO> {
    const { data, error } = await this.supabase
      .from("photographer_settings")
      .update({
        site_title: command.site_title ?? null,
        site_description: command.site_description ?? null,
      })
      .eq("photographer_id", userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }
}
