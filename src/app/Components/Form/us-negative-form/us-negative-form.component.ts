import {Component, Input} from '@angular/core';
import {ApiTypeCategory, ApiUsNegative} from "../../../../../shared";

@Component({
  selector: 'app-us-negative-form',
  templateUrl: './us-negative-form.component.html',
  styleUrls: ['./us-negative-form.component.scss']
})
export class UsNegativeFormComponent {
  @Input() us: ApiUsNegative;

  ApiTypeCategory = ApiTypeCategory;

   imagePlanTypeArray = [
    { id: "9a32410b-059b-421c-9ef1-f3ee3984b3af", path: "assets/images/image_plan_profile/plan_circulaire.png", name: "Circulaire" },
    { id: "c050d90a-0652-4ea0-9a8c-6b836379f742", path: "assets/images/image_plan_profile/plan_ovalaire.png", name: "Ovalaire" },
    { id: "c5fc3f75-5251-4358-9756-df8d33d4f0ca", path: "assets/images/image_plan_profile/plan_ovoide.png", name: "Ovoïde" },
    { id: "1151eac8-b769-46f6-a709-1046863d9f48", path: "assets/images/image_plan_profile/plan_rectangulaire.png", name: "Rectangulaire" },
    { id: "25b4b590-55bc-42de-baae-d81321ef7f84", path: "assets/images/image_plan_profile/plan_polylobe.png", name: "Polylobé" },
  ];


   imageProfileTypeArray = [
    { id: "dd465655-20e9-4e13-808b-41a7ad774f59", path: "assets/images/image_plan_profile/profil_cuvette.png", name: "En cuvette" },
    { id: "a9051294-c25d-44e7-ae23-bcd7b3b305c3", path: "assets/images/image_plan_profile/profil_auge.png", name: "En auge" },
    { id: "6237724d-40c1-4f4a-b03d-9d366276c979", path: "assets/images/image_plan_profile/profil_U.png", name: "En U" },
    { id: "0904af47-ac5c-4ee7-b5df-21e9b6c89081", path: "assets/images/image_plan_profile/profil_V.png", name: "En V" },
    { id: "a4c48fdd-cecf-4254-abe0-6fec2b40daa0", path: "assets/images/image_plan_profile/profil_bouteille.png", name: "En bouteille" },
    { id: "410a14f5-af32-415d-8dcb-269579f58da4", path: "assets/images/image_plan_profile/profil_piriforme.png", name: "Piriforme" },
  ];

   onClickImagePlanType = (typeUuid: string) => {
    this.us.negative_plan = typeUuid;
   }

   onClickImageProfileType = (typeUuid: string) => {
    this.us.negative_profil = typeUuid;
   }
}
