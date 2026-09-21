import json
import re

FAMILIES = [
  {
    "id_comp_family": "FAM-MOTEUR-ELEC",
    "libelle": "Moteur Electrique",
    "code": "MOTEUR",
    "type": "Moteur",
    "description": "Type Moteur Electrique - Tous les moteurs asynchrones triphasés du parc - Principe électromagnétique"
  }
]

TEMPLATES = [
  {
    "id_template": "MOT-ASYNC-75KW-2910-3",
    "libelle": "Moteur Asynchrone 7,5KW 10CV 2910 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "7,5KW", "chevaux": "10CV", "vitesse": "2910 tr/min", "courant": "15,5A", "dimension": "ok", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-3KW-2950-3",
    "libelle": "Moteur Asynchrone 3KW 4CV 2950 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "3KW", "chevaux": "4CV", "vitesse": "2950 tr/min", "courant": "6,3A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-075KW-1440",
    "libelle": "Moteur Asynchrone 0,75KW 1CV 1440 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "0,75KW", "chevaux": "1CV", "vitesse": "1440 tr/min", "courant": "2A", "dimension": "170x120", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-12KW-1380",
    "libelle": "Moteur Asynchrone 1,2KW 1,5CV 1380 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "1,2KW", "chevaux": "1,5CV", "vitesse": "1380 tr/min", "courant": "2,8A", "dimension": "120x110", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-185KW-1420",
    "libelle": "Moteur Asynchrone 18,5kw 25CV 1420 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "18,5kw", "chevaux": "25CV", "vitesse": "1420 tr/min", "courant": "38A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-074-900",
    "libelle": "Moteur Asynchrone 0.74 1CV 900 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "0.74", "chevaux": "1CV", "vitesse": "900 tr/min", "courant": "", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-40KW-1420",
    "libelle": "Moteur Asynchrone 4,0KW 1CV 1420 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "4,0KW", "chevaux": "1CV", "vitesse": "1420 tr/min", "courant": "2A", "dimension": "80x80", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-22KW-1420",
    "libelle": "Moteur Asynchrone 2,2 KW 3CV 1420 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "2,2 KW", "chevaux": "3CV", "vitesse": "1420 tr/min", "courant": "5A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-55KW-1430",
    "libelle": "Moteur Asynchrone 5,5KW 7,5 CV 1430 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "5,5KW", "chevaux": "7,5 CV", "vitesse": "1430 tr/min", "courant": "8,8A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-15KW-1420-2",
    "libelle": "Moteur Asynchrone 1,5kw 2CV 1420 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "1,5kw", "chevaux": "2CV", "vitesse": "1420 tr/min", "courant": "3,8A", "dimension": "16.4", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-57KW-NA",
    "libelle": "Moteur Asynchrone 5,7KW   tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "5,7KW", "chevaux": "", "vitesse": "", "courant": "15A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-55KW-NA",
    "libelle": "Moteur Asynchrone 5,5KW   tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "5,5KW", "chevaux": "", "vitesse": "", "courant": "10A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-5KW-NA",
    "libelle": "Moteur Asynchrone 5KW   tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "5KW", "chevaux": "", "vitesse": "", "courant": "15A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-11-NA",
    "libelle": "Moteur Asynchrone 1.1   tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "1.1", "chevaux": "", "vitesse": "", "courant": "", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-9511KW-1460",
    "libelle": "Moteur Asynchrone 9,5/11KW 13CV 1460 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "9,5/11KW", "chevaux": "13CV", "vitesse": "1460 tr/min", "courant": "22A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-9511KW-2930",
    "libelle": "Moteur Asynchrone 9,5/11KW 13CV 2930 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "9,5/11KW", "chevaux": "13CV", "vitesse": "2930 tr/min", "courant": "", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-75KW-2890",
    "libelle": "Moteur Asynchrone 7,5kw 10CV 2890 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "7,5kw", "chevaux": "10CV", "vitesse": "2890 tr/min", "courant": "15,5A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-11KW-3000",
    "libelle": "Moteur Asynchrone 11KW 15CV 3000 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "11KW", "chevaux": "15CV", "vitesse": "3000 tr/min", "courant": "18A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-75KW-1430-2",
    "libelle": "Moteur Asynchrone 7,5KW 10CV 1430 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "7,5KW", "chevaux": "10CV", "vitesse": "1430 tr/min", "courant": "15A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-075KW-1390",
    "libelle": "Moteur Asynchrone 0,75KW 1 CV 1390 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "0,75KW", "chevaux": "1 CV", "vitesse": "1390 tr/min", "courant": "1,2A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-037KW-1420",
    "libelle": "Moteur Asynchrone 0,37KW 0,5CV 1420 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "0,37KW", "chevaux": "0,5CV", "vitesse": "1420 tr/min", "courant": "3A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-037KW-900",
    "libelle": "Moteur Asynchrone 0,37KW 0,5CV 900 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "0,37KW", "chevaux": "0,5CV", "vitesse": "900 tr/min", "courant": "1,8A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-80-3000",
    "libelle": "Moteur Asynchrone 80  3000 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "80", "chevaux": "", "vitesse": "3000 tr/min", "courant": "", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-013-1400",
    "libelle": "Moteur Asynchrone 0.13  1400 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "0.13", "chevaux": "", "vitesse": "1400 tr/min", "courant": "", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-44-1430",
    "libelle": "Moteur Asynchrone 4.4 3 CV 1430 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "4.4", "chevaux": "3 CV", "vitesse": "1430 tr/min", "courant": "", "dimension": "1,5M X 0,80M", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-10-NA",
    "libelle": "Moteur Asynchrone 10   tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "10", "chevaux": "", "vitesse": "", "courant": "", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-11-1450",
    "libelle": "Moteur Asynchrone 11  1450 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "11", "chevaux": "", "vitesse": "1450 tr/min", "courant": "", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-10A111-720",
    "libelle": "Moteur Asynchrone 10A-11,1A/1,1A 10 CV 720 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "10A-11,1A/1,1A", "chevaux": "10 CV", "vitesse": "720 tr/min", "courant": "11,1A", "dimension": "90 x75", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-10A111-1450",
    "libelle": "Moteur Asynchrone 10A-11,1A/1,1A 2 CV 1450 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "10A-11,1A/1,1A", "chevaux": "2 CV", "vitesse": "1450 tr/min", "courant": "2,7A", "dimension": "90 x75", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-10A111-1420",
    "libelle": "Moteur Asynchrone 10A-11,1A/1,1A 1CV 1420 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "10A-11,1A/1,1A", "chevaux": "1CV", "vitesse": "1420 tr/min", "courant": "2A", "dimension": "90 x75", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-40KW-1435",
    "libelle": "Moteur Asynchrone 4,0KW 5,5CV 1435 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "4,0KW", "chevaux": "5,5CV", "vitesse": "1435 tr/min", "courant": "8,8A", "dimension": "80x80", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-40KW-1400",
    "libelle": "Moteur Asynchrone 4,0KW 2CV 1400 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "4,0KW", "chevaux": "2CV", "vitesse": "1400 tr/min", "courant": "4A", "dimension": "80x80", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-40KW-1430",
    "libelle": "Moteur Asynchrone 4,0KW 5,5CV 1430 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "4,0KW", "chevaux": "5,5CV", "vitesse": "1430 tr/min", "courant": "8,7A", "dimension": "87x80", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-40KW-1460",
    "libelle": "Moteur Asynchrone 4,0KW 2CV 1460 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "4,0KW", "chevaux": "2CV", "vitesse": "1460 tr/min", "courant": "4A", "dimension": "87x80", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-75KW-1430",
    "libelle": "Moteur Asynchrone 7,5 KW 7,5 CV 1430 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "7,5 KW", "chevaux": "7,5 CV", "vitesse": "1430 tr/min", "courant": "9,2A", "dimension": "65x100", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-055KW-1460",
    "libelle": "Moteur Asynchrone /0,55KW 1,5CV 1460 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "/0,55KW", "chevaux": "1,5CV", "vitesse": "1460 tr/min", "courant": "2,8A", "dimension": "65x100", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-75KW-1420",
    "libelle": "Moteur Asynchrone 7,5 KW 1CV 1420 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "7,5 KW", "chevaux": "1CV", "vitesse": "1420 tr/min", "courant": "2A", "dimension": "65x100", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-4KW-1440",
    "libelle": "Moteur Asynchrone 4 KW 5,5 CV 1440 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "4 KW", "chevaux": "5,5 CV", "vitesse": "1440 tr/min", "courant": "19A", "dimension": "170x120", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-11KW-1418",
    "libelle": "Moteur Asynchrone 1,1 KW 1,5CV 1418 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "1,1 KW", "chevaux": "1,5CV", "vitesse": "1418 tr/min", "courant": "3,5A", "dimension": "170x120", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-55KW-3000",
    "libelle": "Moteur Asynchrone 5,5 KW 7,5CV 3000 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "5,5 KW", "chevaux": "7,5CV", "vitesse": "3000 tr/min", "courant": "11A", "dimension": "120x110", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-3A-1450",
    "libelle": "Moteur Asynchrone 3A 7,5 CV 1450 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "3A", "chevaux": "7,5 CV", "vitesse": "1450 tr/min", "courant": "10,7A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-55KW-1450",
    "libelle": "Moteur Asynchrone 5,5KW 7,5CV 1450 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "5,5KW", "chevaux": "7,5CV", "vitesse": "1450 tr/min", "courant": "11,4A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-22KW-1400",
    "libelle": "Moteur Asynchrone 2,2KW 3 CV 1400 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "2,2KW", "chevaux": "3 CV", "vitesse": "1400 tr/min", "courant": "5,3A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-55KW-955",
    "libelle": "Moteur Asynchrone 5,5KW 7,5 CV 955 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "5,5KW", "chevaux": "7,5 CV", "vitesse": "955 tr/min", "courant": "12A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-4KW-2900",
    "libelle": "Moteur Asynchrone 4KW 5,5CV 2900 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "4KW", "chevaux": "5,5CV", "vitesse": "2900 tr/min", "courant": "8,2A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-55KW-1470",
    "libelle": "Moteur Asynchrone 5,5KW 7,5 CV 1470 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "5,5KW", "chevaux": "7,5 CV", "vitesse": "1470 tr/min", "courant": "6A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-75KW-1420-2",
    "libelle": "Moteur Asynchrone 7,5KW 10CV 1420 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "7,5KW", "chevaux": "10CV", "vitesse": "1420 tr/min", "courant": "18A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-15KW-1410",
    "libelle": "Moteur Asynchrone 1,5KW 2CV 1410 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "1,5KW", "chevaux": "2CV", "vitesse": "1410 tr/min", "courant": "4,7A", "dimension": "80x80", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-22KW-1450",
    "libelle": "Moteur Asynchrone 2,2KW 3CV 1450 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "2,2KW", "chevaux": "3CV", "vitesse": "1450 tr/min", "courant": "3A", "dimension": "87x80", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-25KW-1420",
    "libelle": "Moteur Asynchrone 2,5KW 3,5CV 1420 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "2,5KW", "chevaux": "3,5CV", "vitesse": "1420 tr/min", "courant": "5A", "dimension": "65x100", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-22KW-1400-2",
    "libelle": "Moteur Asynchrone 2,2KW 3CV 1400 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "2,2KW", "chevaux": "3CV", "vitesse": "1400 tr/min", "courant": "3A", "dimension": "95x80", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-27A-1400",
    "libelle": "Moteur Asynchrone 2,7A 3CV 1400 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "2,7A", "chevaux": "3CV", "vitesse": "1400 tr/min", "courant": "5,3A", "dimension": "60x95", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-716A-940",
    "libelle": "Moteur Asynchrone 7,16A 3CV 940 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "7,16A", "chevaux": "3CV", "vitesse": "940 tr/min", "courant": "7,16A", "dimension": "80x95", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-45KW-1400",
    "libelle": "Moteur Asynchrone 4,5KW 6CV 1400 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "4,5KW", "chevaux": "6CV", "vitesse": "1400 tr/min", "courant": "", "dimension": "85x95", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-3KW-1425",
    "libelle": "Moteur Asynchrone 3 KW 4CV 1425 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "3 KW", "chevaux": "4CV", "vitesse": "1425 tr/min", "courant": "", "dimension": "130x80", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-15KW-1410-2",
    "libelle": "Moteur Asynchrone 1,5 KW 2CV 1410 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "1,5 KW", "chevaux": "2CV", "vitesse": "1410 tr/min", "courant": "3,4A", "dimension": "80x70", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-3KW-1430",
    "libelle": "Moteur Asynchrone 3 KW 4CV 1430 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "3 KW", "chevaux": "4CV", "vitesse": "1430 tr/min", "courant": "6,3A", "dimension": "120x90", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-25KW-1400",
    "libelle": "Moteur Asynchrone 2,5 KW 3 CV 1400 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "2,5 KW", "chevaux": "3 CV", "vitesse": "1400 tr/min", "courant": "6,5A", "dimension": "75x130", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-15KW-1400",
    "libelle": "Moteur Asynchrone 1,5 KW 2CV 1400 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "1,5 KW", "chevaux": "2CV", "vitesse": "1400 tr/min", "courant": "3,4A", "dimension": "65x70", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-3KW-1430-2",
    "libelle": "Moteur Asynchrone 3 KW 4CV 1430 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "3 KW", "chevaux": "4CV", "vitesse": "1430 tr/min", "courant": "11,5A", "dimension": "74x80", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-3KW-705",
    "libelle": "Moteur Asynchrone 3KW 4CV 705 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "3KW", "chevaux": "4CV", "vitesse": "705 tr/min", "courant": "3,6A", "dimension": "60x70", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-3KW-1415",
    "libelle": "Moteur Asynchrone 3KW 4CV 1415 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "3KW", "chevaux": "4CV", "vitesse": "1415 tr/min", "courant": "", "dimension": "60x70", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-3KW-1425-2",
    "libelle": "Moteur Asynchrone 3KW 4CV 1425 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "3KW", "chevaux": "4CV", "vitesse": "1425 tr/min", "courant": "6,9A", "dimension": "110x85", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-3KW-1700",
    "libelle": "Moteur Asynchrone 3KW 4CV 1700 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "3KW", "chevaux": "4CV", "vitesse": "1700 tr/min", "courant": "", "dimension": "110x85", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-15KW-1400-2",
    "libelle": "Moteur Asynchrone 1,5KW 2CV 1400 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "1,5KW", "chevaux": "2CV", "vitesse": "1400 tr/min", "courant": "4,7A", "dimension": "90x75", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-75KW-920",
    "libelle": "Moteur Asynchrone 7,5KW 10CV 920 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "7,5KW", "chevaux": "10CV", "vitesse": "920 tr/min", "courant": "18A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-9KW-1430",
    "libelle": "Moteur Asynchrone 9KW 12,5CV 1430 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "9KW", "chevaux": "12,5CV", "vitesse": "1430 tr/min", "courant": "18,8A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-22KW-1500",
    "libelle": "Moteur Asynchrone 2,2KW 3CV 1500 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "2,2KW", "chevaux": "3CV", "vitesse": "1500 tr/min", "courant": "6A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-075KW-1410",
    "libelle": "Moteur Asynchrone 0,75KW 1CV 1410 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "0,75KW", "chevaux": "1CV", "vitesse": "1410 tr/min", "courant": "4A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-075KW-1350",
    "libelle": "Moteur Asynchrone 0,75KW 1CV 1350 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "0,75KW", "chevaux": "1CV", "vitesse": "1350 tr/min", "courant": "4A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-3KW-1400",
    "libelle": "Moteur Asynchrone 3KW 4CV 1400 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "3KW", "chevaux": "4CV", "vitesse": "1400 tr/min", "courant": "6,6A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-3KW-1430-3",
    "libelle": "Moteur Asynchrone 3KW 4CV 1430 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "3KW", "chevaux": "4CV", "vitesse": "1430 tr/min", "courant": "6,8A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-11KW-1460",
    "libelle": "Moteur Asynchrone 11KW 15CV 1460 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "11KW", "chevaux": "15CV", "vitesse": "1460 tr/min", "courant": "23A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-4KW-1425",
    "libelle": "Moteur Asynchrone 4 KW 5,5CV 1425 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "4 KW", "chevaux": "5,5CV", "vitesse": "1425 tr/min", "courant": "6,3A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-21KW-880",
    "libelle": "Moteur Asynchrone 2,1 KW 2,8CV 880 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "2,1 KW", "chevaux": "2,8CV", "vitesse": "880 tr/min", "courant": "6,35A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-11KW-1460-2",
    "libelle": "Moteur Asynchrone 11 KW 14CV 1460 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "11 KW", "chevaux": "14CV", "vitesse": "1460 tr/min", "courant": "22A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-75KW-1435",
    "libelle": "Moteur Asynchrone 7,5 KW 10CV 1435 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "7,5 KW", "chevaux": "10CV", "vitesse": "1435 tr/min", "courant": "16,5A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-22KW-1460",
    "libelle": "Moteur Asynchrone 2,2KW 3CV 1460 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "2,2KW", "chevaux": "3CV", "vitesse": "1460 tr/min", "courant": "8A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-75KW-1460",
    "libelle": "Moteur Asynchrone 7,5KW 10CV 1460 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "7,5KW", "chevaux": "10CV", "vitesse": "1460 tr/min", "courant": "16,5A", "dimension": "3,50M X1,20 M", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-75KW-2910",
    "libelle": "Moteur Asynchrone 7,5 KW 10CV 2910 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "7,5 KW", "chevaux": "10CV", "vitesse": "2910 tr/min", "courant": "12,3A", "dimension": "2,30 M X1M", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-44KW-1430",
    "libelle": "Moteur Asynchrone 4,4KW 6CV 1430 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "4,4KW", "chevaux": "6CV", "vitesse": "1430 tr/min", "courant": "18A", "dimension": "2,2M X 0,9M", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-11KW-960",
    "libelle": "Moteur Asynchrone 11KW 15CV 960 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "11KW", "chevaux": "15CV", "vitesse": "960 tr/min", "courant": "23A", "dimension": "3,50M X1,60 M", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-147KW-1337",
    "libelle": "Moteur Asynchrone 14,7kw 20CV 1337 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "14,7kw", "chevaux": "20CV", "vitesse": "1337 tr/min", "courant": "34 A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-22KW-1430",
    "libelle": "Moteur Asynchrone 2,2KW 3 CV 1430 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "2,2KW", "chevaux": "3 CV", "vitesse": "1430 tr/min", "courant": "5,6A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-22KW-1430-2",
    "libelle": "Moteur Asynchrone 2,2KW 3 CV 1430 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "2,2KW", "chevaux": "3 CV", "vitesse": "1430 tr/min", "courant": "1,6A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-92KW-1410",
    "libelle": "Moteur Asynchrone 9,2KW 12,5 CV 1410 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "9,2KW", "chevaux": "12,5 CV", "vitesse": "1410 tr/min", "courant": "13 A", "dimension": "2,50M X2,50M", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-075-3000",
    "libelle": "Moteur Asynchrone 0.75 1CV 3000 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "0.75", "chevaux": "1CV", "vitesse": "3000 tr/min", "courant": "3A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-22KW-1425",
    "libelle": "Moteur Asynchrone 2,2KW 3CV 1425 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "2,2KW", "chevaux": "3CV", "vitesse": "1425 tr/min", "courant": "5,55A", "dimension": "1,90M X 0,70M", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-3KW-1430-4",
    "libelle": "Moteur Asynchrone 3KW 4CV 1430 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "3KW", "chevaux": "4CV", "vitesse": "1430 tr/min", "courant": "6,3A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-15KW-2870",
    "libelle": "Moteur Asynchrone 1,5KW 2CV 2870 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "1,5KW", "chevaux": "2CV", "vitesse": "2870 tr/min", "courant": "4A", "dimension": "3M X1,30M", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-56KW-NA",
    "libelle": "Moteur Asynchrone 5,6KW   tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "5,6KW", "chevaux": "", "vitesse": "", "courant": "14,7A", "dimension": "0,90M X070M", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-45KW-1475",
    "libelle": "Moteur Asynchrone 45kw 60CV 1475 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "45kw", "chevaux": "60CV", "vitesse": "1475 tr/min", "courant": "47 A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-55KW-1470-2",
    "libelle": "Moteur Asynchrone 5,5kw 7,5CV 1470 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "5,5kw", "chevaux": "7,5CV", "vitesse": "1470 tr/min", "courant": "11,7A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-185KW-1460",
    "libelle": "Moteur Asynchrone 18,5KW 25CV 1460 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "18,5KW", "chevaux": "25CV", "vitesse": "1460 tr/min", "courant": "36A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-15KW-1420",
    "libelle": "Moteur Asynchrone 1,5KW 2 CV 1420 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "1,5KW", "chevaux": "2 CV", "vitesse": "1420 tr/min", "courant": "3,7 A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-30KW-1465",
    "libelle": "Moteur Asynchrone 30KW 40 CV 1465 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "30KW", "chevaux": "40 CV", "vitesse": "1465 tr/min", "courant": "60/34A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-15KW-1460",
    "libelle": "Moteur Asynchrone 1,5KW 2 CV 1460 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "1,5KW", "chevaux": "2 CV", "vitesse": "1460 tr/min", "courant": "3,7A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-37KW-1475",
    "libelle": "Moteur Asynchrone 37KW 50 CV 1475 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "37KW", "chevaux": "50 CV", "vitesse": "1475 tr/min", "courant": "70A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-145KW-1450",
    "libelle": "Moteur Asynchrone 1,45KW 2 CV 1450 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "1,45KW", "chevaux": "2 CV", "vitesse": "1450 tr/min", "courant": "3,6A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-45KW-1400-2",
    "libelle": "Moteur Asynchrone 45kw 60CV 1400 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "45kw", "chevaux": "60CV", "vitesse": "1400 tr/min", "courant": "47A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-4KW-1750",
    "libelle": "Moteur Asynchrone 4 kw 5,5CV 1750 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "4 kw", "chevaux": "5,5CV", "vitesse": "1750 tr/min", "courant": "11,7A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-13KW-1400",
    "libelle": "Moteur Asynchrone 13 KW 18 CV 1400 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "13 KW", "chevaux": "18 CV", "vitesse": "1400 tr/min", "courant": "27,8A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-13KW-1440",
    "libelle": "Moteur Asynchrone 13 KW 18 CV 1440 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "13 KW", "chevaux": "18 CV", "vitesse": "1440 tr/min", "courant": "24,5A", "dimension": "11", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-15KW-1456",
    "libelle": "Moteur Asynchrone 15kw 20CV 1456 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "15kw", "chevaux": "20CV", "vitesse": "1456 tr/min", "courant": "30,3A", "dimension": "16.4", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-37KW-1475-2",
    "libelle": "Moteur Asynchrone 37KW 50 CV 1475 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "37KW", "chevaux": "50 CV", "vitesse": "1475 tr/min", "courant": "72A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-75KW-1445",
    "libelle": "Moteur Asynchrone 7,5KW 10CV 1445 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "7,5KW", "chevaux": "10CV", "vitesse": "1445 tr/min", "courant": "15,5A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-15KW-1455",
    "libelle": "Moteur Asynchrone 15KW 20CV 1455 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "15KW", "chevaux": "20CV", "vitesse": "1455 tr/min", "courant": "30,3A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-11KW-1445",
    "libelle": "Moteur Asynchrone 11KW 15CV 1445 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "11KW", "chevaux": "15CV", "vitesse": "1445 tr/min", "courant": "23A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-15KW-NA",
    "libelle": "Moteur Asynchrone 1,5KW 2CV  tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "1,5KW", "chevaux": "2CV", "vitesse": "", "courant": "6,6A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-125KW-1430",
    "libelle": "Moteur Asynchrone 12,5KW 17CV 1430 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "12,5KW", "chevaux": "17CV", "vitesse": "1430 tr/min", "courant": "33 A", "dimension": "9.7", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-30KW-1465-2",
    "libelle": "Moteur Asynchrone 30KW 40 CV 1465 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "30KW", "chevaux": "40 CV", "vitesse": "1465 tr/min", "courant": "58A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-22KW-1455",
    "libelle": "Moteur Asynchrone 22KW 30 CV 1455 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "22KW", "chevaux": "30 CV", "vitesse": "1455 tr/min", "courant": "46,5A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-30KW-2960",
    "libelle": "Moteur Asynchrone 30 KW 40 CV 2960 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "30 KW", "chevaux": "40 CV", "vitesse": "2960 tr/min", "courant": "57,5A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-55KW-3000-2",
    "libelle": "Moteur Asynchrone 55 KW 74,32CV 3000 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "55 KW", "chevaux": "74,32CV", "vitesse": "3000 tr/min", "courant": "101 A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-74KW-NA",
    "libelle": "Moteur Asynchrone 7,4 KW   tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "7,4 KW", "chevaux": "", "vitesse": "", "courant": "19,4A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-74KW-NA-2",
    "libelle": "Moteur Asynchrone 7,4KW   tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "7,4KW", "chevaux": "", "vitesse": "", "courant": "19,4A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-7KW-NA",
    "libelle": "Moteur Asynchrone 7KW   tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "7KW", "chevaux": "", "vitesse": "", "courant": "18,4A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-65KW-NA",
    "libelle": "Moteur Asynchrone 6,5KW   tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "6,5KW", "chevaux": "", "vitesse": "", "courant": "17,1A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-185KW-1450",
    "libelle": "Moteur Asynchrone 18,5kw 25CV 1450 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "18,5kw", "chevaux": "25CV", "vitesse": "1450 tr/min", "courant": "38A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-185KW-970",
    "libelle": "Moteur Asynchrone 18,5kw 25CV 970 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "18,5kw", "chevaux": "25CV", "vitesse": "970 tr/min", "courant": "22,4A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-11KW-910",
    "libelle": "Moteur Asynchrone 1,1 KW 1,5 CV 910 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "1,1 KW", "chevaux": "1,5 CV", "vitesse": "910 tr/min", "courant": "3,5A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-65KW-1400",
    "libelle": "Moteur Asynchrone 6,5KW 9 CV 1400 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "6,5KW", "chevaux": "9 CV", "vitesse": "1400 tr/min", "courant": "14A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-15KW-1450",
    "libelle": "Moteur Asynchrone 15KW 20CV 1450 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "15KW", "chevaux": "20CV", "vitesse": "1450 tr/min", "courant": "30,3A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-9511KW-1460-2",
    "libelle": "Moteur Asynchrone 9,5/11KW 13 CV 1460 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "9,5/11KW", "chevaux": "13 CV", "vitesse": "1460 tr/min", "courant": "22A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-9511KW-2930-2",
    "libelle": "Moteur Asynchrone 9,5/11KW 13 CV 2930 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "9,5/11KW", "chevaux": "13 CV", "vitesse": "2930 tr/min", "courant": "", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-11KW-2920",
    "libelle": "Moteur Asynchrone 11KW 15CV 2920 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "11KW", "chevaux": "15CV", "vitesse": "2920 tr/min", "courant": "21A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-11KW-2918",
    "libelle": "Moteur Asynchrone 11KW 15CV 2918 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "11KW", "chevaux": "15CV", "vitesse": "2918 tr/min", "courant": "20,41A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-75KW-2910-2",
    "libelle": "Moteur Asynchrone 7,5KW  2910 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "7,5KW", "chevaux": "", "vitesse": "2910 tr/min", "courant": "15,5A", "dimension": "ok", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-55KW-2840",
    "libelle": "Moteur Asynchrone 5,5KW 10CV 2840 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "5,5KW", "chevaux": "10CV", "vitesse": "2840 tr/min", "courant": "20,5A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-11KW-2920-2",
    "libelle": "Moteur Asynchrone 11KW 15CV 2920 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "11KW", "chevaux": "15CV", "vitesse": "2920 tr/min", "courant": "15,2A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-75KW-2910-4",
    "libelle": "Moteur Asynchrone 7,5kw 10CV 2910 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "7,5kw", "chevaux": "10CV", "vitesse": "2910 tr/min", "courant": "14,23A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-4KW-1410",
    "libelle": "Moteur Asynchrone 4KW 5,5CV 1410 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "4KW", "chevaux": "5,5CV", "vitesse": "1410 tr/min", "courant": "9,4A", "dimension": "95x80", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-15KW-1420-3",
    "libelle": "Moteur Asynchrone 1,5KW 2CV 1420 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "1,5KW", "chevaux": "2CV", "vitesse": "1420 tr/min", "courant": "3,5A", "dimension": "95x80", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-22KW-1415",
    "libelle": "Moteur Asynchrone 2,2KW 3CV 1415 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "2,2KW", "chevaux": "3CV", "vitesse": "1415 tr/min", "courant": "5,4A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-11KW-1460-3",
    "libelle": "Moteur Asynchrone 1,1KW 1,5CV 1460 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "1,1KW", "chevaux": "1,5CV", "vitesse": "1460 tr/min", "courant": "2,8A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-55KW-1440",
    "libelle": "Moteur Asynchrone 5,5 KW 3CV 1440 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "5,5 KW", "chevaux": "3CV", "vitesse": "1440 tr/min", "courant": "7 A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-4KW-1440-2",
    "libelle": "Moteur Asynchrone 4kw 5,5 CV 1440 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "4kw", "chevaux": "5,5 CV", "vitesse": "1440 tr/min", "courant": "15,5A", "dimension": "230x170", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-12KW-1380-2",
    "libelle": "Moteur Asynchrone 1,2KW 1,5 CV 1380 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "1,2KW", "chevaux": "1,5 CV", "vitesse": "1380 tr/min", "courant": "2,8A", "dimension": "230x170", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-4KW-1440-3",
    "libelle": "Moteur Asynchrone 4KW 5,5CV 1440 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "4KW", "chevaux": "5,5CV", "vitesse": "1440 tr/min", "courant": "16,6 A", "dimension": "170x130", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-075KW-1420",
    "libelle": "Moteur Asynchrone 0,75KW 1CV 1420 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "0,75KW", "chevaux": "1CV", "vitesse": "1420 tr/min", "courant": "2,5A", "dimension": "170x130", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-4KW-1500",
    "libelle": "Moteur Asynchrone 4KW 5,5CV 1500 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "4KW", "chevaux": "5,5CV", "vitesse": "1500 tr/min", "courant": "7,4A", "dimension": "320x160", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-15KW-1420-4",
    "libelle": "Moteur Asynchrone 1,5KW 2CV 1420 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "1,5KW", "chevaux": "2CV", "vitesse": "1420 tr/min", "courant": "3A", "dimension": "320x160", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-KW-NA",
    "libelle": "Moteur Asynchrone KW   tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "KW", "chevaux": "", "vitesse": "", "courant": "", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-074KW-900",
    "libelle": "Moteur Asynchrone 0,74KW 1CV 900 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "0,74KW", "chevaux": "1CV", "vitesse": "900 tr/min", "courant": "3,5A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-11KW-900",
    "libelle": "Moteur Asynchrone 1,1KW 1,5CV 900 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "1,1KW", "chevaux": "1,5CV", "vitesse": "900 tr/min", "courant": "3,5A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-11KW-715",
    "libelle": "Moteur Asynchrone 1,1KW 1,5CV 715 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "1,1KW", "chevaux": "1,5CV", "vitesse": "715 tr/min", "courant": "3,1A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-075KW-920",
    "libelle": "Moteur Asynchrone 0,75KW 1CV 920 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "0,75KW", "chevaux": "1CV", "vitesse": "920 tr/min", "courant": "3A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-15KW-900",
    "libelle": "Moteur Asynchrone 1,5KW 1,5CV 900 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "1,5KW", "chevaux": "1,5CV", "vitesse": "900 tr/min", "courant": "3,4A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-12KW-940",
    "libelle": "Moteur Asynchrone 1,2KW  940 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "1,2KW", "chevaux": "", "vitesse": "940 tr/min", "courant": "3,1A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-15KW-920",
    "libelle": "Moteur Asynchrone 1,5KW 2CV 920 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "1,5KW", "chevaux": "2CV", "vitesse": "920 tr/min", "courant": "3,3A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-11KW-700",
    "libelle": "Moteur Asynchrone 1,1KW 1,4CV 700 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "1,1KW", "chevaux": "1,4CV", "vitesse": "700 tr/min", "courant": "3,4A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-11KW-720",
    "libelle": "Moteur Asynchrone 1,1KW 1,5CV 720 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "1,1KW", "chevaux": "1,5CV", "vitesse": "720 tr/min", "courant": "3,5A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-15KW-940",
    "libelle": "Moteur Asynchrone 1,5KW  940 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "1,5KW", "chevaux": "", "vitesse": "940 tr/min", "courant": "4A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-11KW-2980",
    "libelle": "Moteur Asynchrone 1,1KW 1,5 CV 2980 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "1,1KW", "chevaux": "1,5 CV", "vitesse": "2980 tr/min", "courant": "3,84 A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-3KW-2950",
    "libelle": "Moteur Asynchrone 3KW 4 CV 2950 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "3KW", "chevaux": "4 CV", "vitesse": "2950 tr/min", "courant": "4A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-18KW-2920",
    "libelle": "Moteur Asynchrone 1,8KW 2,5 CV 2920 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "1,8KW", "chevaux": "2,5 CV", "vitesse": "2920 tr/min", "courant": "3,5A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-15KW-2950",
    "libelle": "Moteur Asynchrone 1,5KW 2 CV 2950 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "1,5KW", "chevaux": "2 CV", "vitesse": "2950 tr/min", "courant": "4A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-11KW-2950",
    "libelle": "Moteur Asynchrone 1,1KW 1,5 CV 2950 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "1,1KW", "chevaux": "1,5 CV", "vitesse": "2950 tr/min", "courant": "3,84 A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-075KW-3000",
    "libelle": "Moteur Asynchrone 0,75KW 1 CV 3000 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "0,75KW", "chevaux": "1 CV", "vitesse": "3000 tr/min", "courant": "3,5A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-075KW-2950",
    "libelle": "Moteur Asynchrone 0,75KW 1 CV 2950 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "0,75KW", "chevaux": "1 CV", "vitesse": "2950 tr/min", "courant": "3,5A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-075KW-2980",
    "libelle": "Moteur Asynchrone 0,75KW 1 CV 2980 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "0,75KW", "chevaux": "1 CV", "vitesse": "2980 tr/min", "courant": "3,5A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-3KW-2950-2",
    "libelle": "Moteur Asynchrone 3KW 4CV 2950 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "3KW", "chevaux": "4CV", "vitesse": "2950 tr/min", "courant": "6A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-22KW-2950",
    "libelle": "Moteur Asynchrone 2,2 KW 3 CV 2950 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "2,2 KW", "chevaux": "3 CV", "vitesse": "2950 tr/min", "courant": "5A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-3KW-2860",
    "libelle": "Moteur Asynchrone 3KW 4 CV 2860 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "3KW", "chevaux": "4 CV", "vitesse": "2860 tr/min", "courant": "6,3A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-3KW-2860-2",
    "libelle": "Moteur Asynchrone 3KW 4CV 2860 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "3KW", "chevaux": "4CV", "vitesse": "2860 tr/min", "courant": "6,3A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-3KW-2860-3",
    "libelle": "Moteur Asynchrone 3KW 4CV 2860 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "3KW", "chevaux": "4CV", "vitesse": "2860 tr/min", "courant": "6,3 A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-11KW-940",
    "libelle": "Moteur Asynchrone 1,1KW 1,5CV 940 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "1,1KW", "chevaux": "1,5CV", "vitesse": "940 tr/min", "courant": "3A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-04KW-1380",
    "libelle": "Moteur Asynchrone 0,4KW 0,5CV 1380 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "0,4KW", "chevaux": "0,5CV", "vitesse": "1380 tr/min", "courant": "1,1A", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-15-940",
    "libelle": "Moteur Asynchrone 1.5  940 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "1.5", "chevaux": "", "vitesse": "940 tr/min", "courant": "", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-165-1456",
    "libelle": "Moteur Asynchrone 16.5 20CV 1456 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "16.5", "chevaux": "20CV", "vitesse": "1456 tr/min", "courant": "", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-165-1420",
    "libelle": "Moteur Asynchrone 16.5 2CV 1420 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "16.5", "chevaux": "2CV", "vitesse": "1420 tr/min", "courant": "", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-2155-NA",
    "libelle": "Moteur Asynchrone 215.5   tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "215.5", "chevaux": "", "vitesse": "", "courant": "", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-21-3000",
    "libelle": "Moteur Asynchrone 2.1 3CV 3000 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "2.1", "chevaux": "3CV", "vitesse": "3000 tr/min", "courant": "", "dimension": "3M X1,60M", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-45-1475",
    "libelle": "Moteur Asynchrone 45  1475 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "45", "chevaux": "", "vitesse": "1475 tr/min", "courant": "", "dimension": "25", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-75-1475",
    "libelle": "Moteur Asynchrone 75  1475 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "75", "chevaux": "", "vitesse": "1475 tr/min", "courant": "", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-15-1450",
    "libelle": "Moteur Asynchrone 15  1450 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "15", "chevaux": "", "vitesse": "1450 tr/min", "courant": "", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-3015-1470",
    "libelle": "Moteur Asynchrone 30                 1,5  1470 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "30                 1,5", "chevaux": "", "vitesse": "1470 tr/min", "courant": "", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-4-900",
    "libelle": "Moteur Asynchrone 4  900 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "4", "chevaux": "", "vitesse": "900 tr/min", "courant": "", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-4-1400",
    "libelle": "Moteur Asynchrone 4  1400 tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "4", "chevaux": "", "vitesse": "1400 tr/min", "courant": "", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  },
  {
    "id_template": "MOT-ASYNC-96-NA",
    "libelle": "Moteur Asynchrone 9,/,6   tr/min",
    "type": "Moteur Asynchrone Triphasé",
    "id_family": "FAM-MOTEUR-ELEC",
    "specs": {"puissance": "9,/,6", "chevaux": "", "vitesse": "", "courant": "", "dimension": "", "type_moteur": "Asynchrone", "alimentation": "Triphasé 380V"}
  }
]

# Write to file
with open('src/data/seedData.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace INITIAL_COMP_FAMILIES
content = re.sub(r'export const INITIAL_COMP_FAMILIES\s*=\s*\[.*?\];', f'export const INITIAL_COMP_FAMILIES = {json.dumps(FAMILIES, indent=2, ensure_ascii=False)};', content, flags=re.DOTALL)

# Replace INITIAL_COMP_TEMPLATES
content = re.sub(r'export const INITIAL_COMP_TEMPLATES\s*=\s*\[.*?\];', f'export const INITIAL_COMP_TEMPLATES = {json.dumps(TEMPLATES, indent=2, ensure_ascii=False)};', content, flags=re.DOTALL)

with open('src/data/seedData.js', 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Populated {len(FAMILIES)} families and {len(TEMPLATES)} templates successfully!")
