export type MinecraftProfile = {
  id: string;
  name: string;
};

export interface ProfileProvider {
  resolveByUsername(username: string): Promise<MinecraftProfile | null>;
}

export class MojangProfileProvider implements ProfileProvider {
  async resolveByUsername(username: string): Promise<MinecraftProfile | null> {
    const response = await fetch(
      `https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`,
      {
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    if (response.status === 204 || response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error("UPSTREAM_UNAVAILABLE");
    }

    const profile = (await response.json()) as Partial<MinecraftProfile>;

    if (!profile?.id || !profile?.name) {
      throw new Error("INVALID_UPSTREAM_PAYLOAD");
    }

    return { id: profile.id, name: profile.name };
  }
}
