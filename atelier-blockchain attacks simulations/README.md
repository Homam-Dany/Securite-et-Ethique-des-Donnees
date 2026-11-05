# Atelier 2 : Simulation d'Attaques Blockchain, Détection et Mitigation

Projet réalisé dans le cadre du module **Sécurité et Éthique des Données** (Master IDIA).

Ce projet implémente une plateforme expérimentale pour simuler quatre attaques classiques sur une blockchain (Proof of Work et réseau P2P), analyser leur impact et tester des mécanismes de détection et de défense (mitigation).

---

## Ce que fait le projet

Le code simule et compare 4 attaques en mode **Vulnérable** (sans protection) et en mode **Protégé** (avec détection) :

1. **Attaque à 51% & Double Dépense** : L'attaquant possède la majorité du hashrate et construit une chaîne secrète pour annuler une transaction après coup. *(Défense : règle de finalité / limitation de la profondeur de réorganisation)*.
2. **Selfish Mining (Minage Égoïste)** : L'attaquant garde ses blocs secrets pour forcer les mineurs honnêtes à gaspiller leur puissance sur des blocs orphelins. *(Défense : règle de fraîcheur et tie-breaking neutre)*.
3. **Block Withholding (BWH)** : Au sein d'une pool de minage, un membre soumet ses *shares* pour toucher des gains mais détruit volontairement les blocs complets. *(Défense : test statistique de conformité des soumissions)*.
4. **Sybil / Eclipse Attack** : L'attaquant inonde le réseau P2P avec de faux nœuds pour isoler une cible et contrôler ses connexions. *(Défense : diversité stricte des sous-réseaux IP)*.

Les simulations génèrent automatiquement des fichiers CSV contenant les résultats de balayage pour chaque scénario.

---

## Prérequis

- Un compilateur C++ supportant C++11 (ex. `g++` / MinGW).
- Python 3 avec `pandas` et `matplotlib` pour les graphiques.

---

## 1. Compiler et exécuter la simulation (C++)

Ouvrez un terminal dans le dossier du projet :

```powershell
# 1. Compiler le code
g++ -std=c++11 Atelier2_Solution.cpp -o Atelier2_Solution.exe

# 2. Lancer la simulation
.\Atelier2_Solution.exe
```

La simulation affiche les étapes de chaque attaque dans la console, compare l'état vulnérable vs protégé, et exporte les résultats dans des fichiers `.csv`.

---

## 2. Afficher les graphiques en direct (Python)

Pour visualiser les courbes et les résultats sous forme de fenêtres interactives :

```powershell
python generer_graphiques.py
```

> **Astuce :** Si la commande `python` ne se lance pas directement, vous pouvez utiliser :
> ```powershell
> & "$env:LOCALAPPDATA\Python\bin\python.exe" generer_graphiques.py
> ```

Les fenêtres s'ouvrent en direct (vous pouvez zoomer et explorer les valeurs). Les images sont également enregistrées en haute résolution dans le dossier `graphiques/`.

---

## Structure des fichiers

- `Atelier2_Solution.cpp` : Code source C++ principal de la blockchain et des simulations.
- `generer_graphiques.py` : Script Python pour tracer les graphiques d'analyse.
- `Atelier 2 - Blockchain attacks simulation.pdf` : Énoncé du sujet de l'atelier.
