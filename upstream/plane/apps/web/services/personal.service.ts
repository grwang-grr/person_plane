import { APIService } from "./api.service";

export type PersonalBackup = { name: string; size: number };

class PersonalService extends APIService {
  constructor() {
    super("");
  }

  async listBackups(): Promise<PersonalBackup[]> {
    const response = await this.get("/api/personal/backups/");
    return response.data.results;
  }

  async createBackup(): Promise<PersonalBackup> {
    const response = await this.post("/api/personal/backups/");
    return response.data;
  }
}

export const personalService = new PersonalService();
