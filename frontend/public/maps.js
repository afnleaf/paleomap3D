// where the hell do i put this
const mapNames = [
    "Present-day\n(Holocene, 0 Ma)",
    "Early Pliocene\n(Zanclean, 4.47 Ma)",
    "Middle/Late Miocene\n(Serravallian&Tortonian, 10.5 Ma)",
    "Middle Miocene\n(Langhian, 14.9 Ma)",
    "Early Miocene\n(Aquitanian&Burdigalian, 19.5 Ma)",
    "Late Oligocene\n(Chattian, 25.6 Ma)",
    "Early Oligocene\n(Rupelian, 31 Ma)",
    "Late Eocene\n(Priabonian, 35.9 Ma)",
    "Late Middle Eocene\n(Bartonian, 39.5 Ma)",
    "Early Middle Eocene\n(Lutetian, 44.5 Ma)",
    "Early Eocene\n(Ypresian, 51.9 Ma)",
    "Paleocene/Eocene Boundary\n(PETM, 56 Ma)",
    "Paleocene\n(Danian & Thanetian, 61 Ma)",
    "KT Boundary\n(Latest Maastrichtian, 66 Ma)",
    "Late Cretaceous\n(Maastrichtian, 69 Ma)",
    "Late Cretaceous\n(Late Campanian, 75 Ma)",
    "Late Cretaceous\n(Early Campanian, 80.8 Ma)",
    "Late Cretaceous\n(Santonian&Coniacian, 86.7 Ma)",
    "Mid-Cretaceous\n(Turonian , 91.9 Ma)",
    "Mid-Cretaceous\n(Cenomanian, 97.2 Ma)",
    "Early Cretaceous\n(Late Albian, 102.6 Ma)",
    "Early Cretaceous\n(Middle Albian, 107 Ma)",
    "Early Cretaceous\n(Early Albian, 111 Ma)",
    "Early Cretaceous\n(Late Aptian, 115.8 Ma)",
    "Early Cretaceous\n(Early Aptian, 121.8 Ma)",
    "Early Cretaceous\n(Barremian, 127.2 Ma)",
    "Early Cretaceous\n(Hauterivian, 131.2 Ma)",
    "Early Cretaceous\n(Valanginian, 136.4 Ma)",
    "Early Cretaceous\n(Berriasian, 142.4 Ma)",
    "Jurassic/Cretaceous Boundary\n(145 Ma)",
    "Late Jurassic\n(Tithonian, 148.6 Ma)",
    "Late Jurassic\n(Kimmeridgian, 154.7 Ma)",
    "Late Jurassic\n(Oxfordian, 160.4 Ma)",
    "Middle Jurassic\n(Callovian, 164.8 Ma)",
    "Middle Jurassic\n(Bajocian&Bathonian, 168.2)",
    "Middle Jurassic\n(Aalenian, 172.2 Ma)",
    "Early Jurassic\n(Toarcian, 178.4 Ma)",
    "Early Jurassic\n(Pliensbachian, 186.8 Ma)",
    "Early Jurassic\n(Sinemurian/Pliensbachian, 190.8 Ma)",
    "Early Jurassic\n(Hettangian&Sinemurian, 196 Ma)",
    "Late Triassic\n(Rhaetian/Hettangian, 201.3 Ma)",
    "Late Triassic\n(Rhaetian, 204.9 Ma)",
    "Late Triassic\n(Late Norian, 213.2 Ma)",
    "Late Triassic\n(Mid Norian, 217.8 Ma)",
    "Late Triassic\n(Early Norian, 222.4 Ma)",
    "Late Triassic\n(Carnian/Norian 227 Ma)",
    "Late Triassic\n(Carnian, 232 Ma)",
    "Late Triassic\n(Early Carnian, 233.6)",
    "Middle Triassic\n(Ladinian, 239.5 Ma)",
    "Middle Triassic\n(Anisian, 244.6 Ma)",
    "Permo-Triassic Boundary\n(252 Ma)",
    "Late Permian\n(Lopingian, 256 Ma)",
    "Late Middle Permian\n(Capitanian, 262.5 Ma)",
    "Middle Permian\n(Wordian/Capitanian Boundary 265.1 Ma)",
    "Middle Permian\n(Roadian&Wordian, 268.7 Ma)",
    "Early Permian\n(Late Kungurian, 275 Ma)",
    "Early Permian\n(Early Kungurian, 280 Ma)",
    "Early Permian\n(Artinskian, 286.8 Ma)",
    "Early Permian\n(Sakmarian, 292.6 Ma)",
    "Early Permian\n(Asselian, 297 Ma)",
    "Late Pennsylvanian\n(Gzhelian, 301.3 Ma)",
    "Late Pennsylvanian\n(Kasimovian, 305.4 Ma)",
    "Middle Pennsylvanian\n(Moscovian, 311.1 Ma)",
    "Early/Middle Carboniferous\n(Baskirian/Moscovian boundary, 314.6 Ma)",
    "Early Pennsylvanian\n(Bashkirian, 319.2 Ma)",
    "Late Mississippian\n(Serpukhovian, 327 Ma)",
    "Late Mississippian\n(Visean/Serpukhovian boundary, 330.9 Ma)",
    "Middle Mississippian\n(Late Visean, 333 Ma)",
    "Middle Mississippian\n(Middle Visean, 338.8Ma)",
    "Middle Mississippian\n(Early Visean, 344 Ma)",
    "Early Mississippian\n(Late Tournaisian, 349 Ma)",
    "Early Mississippian\n(Early Tournaisian, 354Ma)",
    "Devono-Carboniferous Boundary\n(358.9 Ma)",
    "Late Devonian\n(Middle Famennian, 365.6 Ma)",
    "Late Devonian\n(Early Famennian, 370 Ma)",
    "Late Devonian\n(Late Frasnian, 375 Ma)",
    "Late Devonian\n(Early Frasnian, 380 Ma)",
    "Middle Devonian\n(Givetian, 385.2 Ma)",
    "Middle Devonian\n(Eifelian, 390.5 Ma)",
    "Early Devonian\n(Late Emsian, 395 Ma)",
    "Early Devonian\n(Middle Emsian, 400 Ma)",
    "Early Devonian\n(Early Emsian, 405 Ma)",
    "Early Devonian\n(Pragian, 409.2 Ma)",
    "Early Devonian\n(Lochkovian, 415 Ma)",
    "Late Silurian\n(Pridoli, 421.1 Ma)",
    "Late Silurian\n(Ludlow, 425.2 Ma)",
    "Middle Silurian\n(Wenlock, 430.4 Ma)",
    "Early Silurian\n(Late Llandovery, 436 Ma)",
    "Early Silurian\n(Early Llandovery, 441.2 Ma)",
    "Late Ordovician\n(Hirnantian, 444.5 Ma)",
    "Late Ordovician\n(Katian, 449.1 Ma)",
    "Late Ordovician\n(Sandbian, 455.7 Ma)",
    "Middle Ordovician\n(Late Darwillian,460 Ma)",
    "Middle Ordovician\n(Early Darwillian,465 Ma)",
    "Early Ordovician\n(Floian/Dapingianboundary, 470 Ma)",
    "Early Ordovician\n(Late Early Floian, 475 Ma)",
    "Early Ordovician\n(Tremadoc, 481.6 Ma)",
    "Cambro-Ordovician Boundary\n(485.4 Ma)",
    "Late Cambrian\n(Jiangshanian, 491.8 Ma)",
    "Late Cambrian\n(Pabian, 495.5 Ma)",
    "Late Middle Cambrian\n(Guzhangian, 498.8 Ma)",
    "Late Middle Cambrian\n(Early Epoch 3, 505 Ma)",
    "Early Middle Cambrian\n(Late Epoch 2, 510 Ma)",
    "Early Middle Cambrian\n(Middle Epoch 2, 515 Ma)",
    "Early/Middle Cambrian boundary\n(520 Ma)",
    "Early Cambrian\n(Late Terreneuvian, 525 Ma)",
    "Early Cambrian\n(Middle Terreneuvian, 530 Ma)",
    "Early Cambrian\n(Early Terreneuvian, 535 Ma)",
    "Cambrian/Precambrian boundary\n(541 Ma)"
  ];

export default mapNames;
