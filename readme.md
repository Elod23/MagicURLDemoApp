MagicURL Biztonsagi Res Demo App

Telepitesi utmutato
Szukseges eszkozok:

- MySQL Server, kunnyen letoltheto futtatva a `choco install mysql` paranccsal
- Node.Js, szinten: `choco install nodejs`

Ezek utan a `npm i` parancs root folderbol valo futtatasaval telepitenunk kell a projekt fuggosegeit.
Ezek a fuggosegek a package.json-ban vannak felsorolva.

Inditashoz:

- A db_create_schema.sql fajl tartalmazza ures sorokkal elvalasztva azt a harom parancsot,
  amit futtatnunk kell hogy kialakitsuk a megfelelo adatbazis semat(es egy tesztadatot).
- a `node index` parancs futtatasaval elindul az app. Mivel a node eloterben futtatja az express applikaciokat,
  figyeljuk a `Server is running...` valaszt, majd ez a folyamat elfoglal egy terminalt.

  Az App egy teszt Gmail fiokot hasznal a magic linkek elkuldeserhez. Kerem ne ijedjenek meg ha a testszoftbizmailer@gmail.com email cimrol uzenetet kapnak.

  Remelem tetszeni fog es a Tanarno egyedinek talalja,
  Varga Elod
