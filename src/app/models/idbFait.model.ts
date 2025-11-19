export class IdbFait {
  constructor(
    public projetId: number,
    public numprov: string,
    public secteur: number,
    public ensembles: number[],
    public identification: string,
    public datation: string,
    public mobilier: string,
    public minute: string,
    public email: string,
  ) {}
}
