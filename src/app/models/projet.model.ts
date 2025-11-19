export class Projet {
  constructor(
    public email: string,
    public name: string,
    public status: string,
    public pays: string,
    public commune: string,
    public codeSite: string,
    public lieuDit: string,
    public departement: string,
    public region: string,
    public responsable: string,
    public annee: string,
    public genre: string,
    public operateur: string,
    public numOperation: string,
    public numerotation: string,
  ) {}
}
