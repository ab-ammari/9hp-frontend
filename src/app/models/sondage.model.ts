export class Sondage {
  constructor(
    public numero: number,
    public secteur: number,
    public genre: string,
    public remarques: string,
    public email: string,
    public longueur: number,
    public largeur: number,
    public hauteur: number,
    public zsup: number,
    public zinf: number,
    public description: string,
    public coupes: number[],
    public coupedescription: string,
    public faits: number[],
    public mobiliers: number[],
    public mobilierremarquable: string,
    public topos: number[],
    public unite_ids: number[],
  ) {}
}
