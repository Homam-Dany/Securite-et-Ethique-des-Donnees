#include <iostream>
#include <string>
#include <vector>
#include <sstream>
#include <iomanip>
#include <cstdint>
#include <cstdlib>
#include <random>
#include <map>
#include <chrono>
#include <cmath>
#include <algorithm>
#include <fstream>
#include <functional>
#include <numeric>

using namespace std;
using Horloge = chrono::high_resolution_clock;

// PARTIE 1 : STRUCTURE FONDAMENTALE DE LA BLOCKCHAIN  (INCHANGEE)

// Fonction de hachage: transforme un texte en une empreinte hexadécimale.
string hashTexte(const string& texte) {
    uint64_t hash = 14695981039346656037ULL;

    for (unsigned char c : texte) {
        hash ^= c;
        hash *= 1099511628211ULL;
    }

    stringstream sortie;
    sortie << hex << setfill('0') << setw(16) << hash;

    return sortie.str();
}

// Chaque bloc possède cinq informations fondamentales : index, données, hashPrécédent, nonce et hash.
struct Bloc {
    int index;
    string donnees;
    string hashPrecedent;
    uint64_t nonce;
    string hash;
    int timestamp; // Horodatage simulé (pour détection de propagation)
    string mineur; // Identifiant du mineur (ex: "Honnete", "Attaquant")

    // Calcul du hash du bloc : concaténation des attributs
    string calculerHash() const {
        return hashTexte(
            to_string(index) +
            donnees +
            hashPrecedent +
            to_string(nonce) +
            mineur
        );
    }

    // Minage du bloc avec Proof of Work : recherche d'un nonce valide
    void miner(int difficulte) {
        string cible(difficulte, '0');
        nonce = 0;

        do {
            hash = calculerHash();
            if (hash.substr(0, difficulte) == cible) {
                break;
            }
            nonce++;
        } while (true);
    }
};

// Création du bloc Genesis
Bloc creerGenesis() {
    Bloc genesis{
        0,
        "Bloc Genesis",
        string(16, '0'),
        0,
        "",
        0,
        "System"
    };

    genesis.miner(0);
    return genesis;
}

// Ajouter un bloc à une chaîne
void ajouterBloc(
    vector<Bloc>& chaine,
    const string& donnees,
    int difficulte,
    const string& mineur = "Inconnu",
    int timestamp = 0
) {
    Bloc b;
    b.index = chaine.size();
    b.donnees = donnees;
    b.hashPrecedent = chaine.back().hash;
    b.nonce = 0;
    b.hash = "";
    b.mineur = mineur;
    b.timestamp = timestamp;

    b.miner(difficulte);
    chaine.push_back(b);
}

// Structure pour le Grand Livre (Ledger) pour vérifier les soldes réels (Double Spending)
struct Ledger {
    map<string, double> soldes;

    Ledger() {
        soldes["Homam"] = 100.0;
        soldes["Bilal"] = 0.0;
        soldes["Houssam"] = 0.0;
    }

    bool executerTransaction(const string& expediteur, const string& destinataire, double montant) {
        if (soldes[expediteur] >= montant) {
            soldes[expediteur] -= montant;
            soldes[destinataire] += montant;
            return true;
        }
        return false;
    }

    void afficherSoldes() const {
        cout << "   [Soldes actuels] Homam: " << soldes.at("Homam")
             << " coins | Bilal (Marchand): " << soldes.at("Bilal")
             << " coins | Houssam: " << soldes.at("Houssam") << " coins\n";
    }
};

// NOUVEAU : vérification d'une chaîne reçue (liens, hash, difficulté PoW).
// Utilisée par la défense avant d'accepter une réorganisation.
bool chaineValide(const vector<Bloc>& chaine, int difficulte) {
    string cible(difficulte, '0');
    for (size_t i = 1; i < chaine.size(); i++) {
        if (chaine[i].hashPrecedent != chaine[i - 1].hash) return false;
        if (chaine[i].hash != chaine[i].calculerHash()) return false;
        if (chaine[i].hash.substr(0, difficulte) != cible) return false;
    }
    return true;
}

// PARTIE 2 : OUTILS D'EVALUATION (NOUVEAU)

// Résultat d'UNE exécution. La précision et le rappel ne sont plus écrits en dur :
// ils sont calculés plus bas sur de nombreuses exécutions (matrice de confusion).
struct ResultatAttaque {
    string nomAttaque;
    bool succes;             // l'attaque a atteint son objectif
    bool detecte;            // le module de détection a levé une alerte
    int tempsDetection;      // tour / bloc / candidat de l'alerte (-1 si aucune)
    double pertesEconomiques;// En coins
    double surcoutDefenseMs; // Temps CPU mesuré du module de détection/mitigation
    double partRecompenses;  // Part de récompenses de l'attaquant (Selfish Mining)
};

// Seuils ADAPTATIFS : appris sur la blockchain de référence (voir calibrerSeuils)
struct Seuils {
    double orphelinsSelfish = 0.12;    // taux d'orphelins sur fenêtre glissante
    double concentrationSybil = 0.35;  // part max d'un sous-réseau parmi les candidats
};
Seuils g_seuils;

double moyenne(const vector<double>& v) {
    if (v.empty()) return 0.0;
    return accumulate(v.begin(), v.end(), 0.0) / v.size();
}

double ecartType(const vector<double>& v) {
    if (v.size() < 2) return 0.0;
    double m = moyenne(v), s = 0.0;
    for (double x : v) s += (x - m) * (x - m);
    return sqrt(s / (v.size() - 1));
}

double msDepuis(Horloge::time_point t0) {
    return chrono::duration<double, milli>(Horloge::now() - t0).count();
}

// P(X <= k) pour X ~ Binomiale(n, p)
double cdfBinomiale(int k, int n, double p) {
    if (k < 0) return 0.0;
    if (k >= n || p <= 0.0) return 1.0;
    if (p >= 1.0) return 0.0;
    double somme = 0.0;
    for (int i = 0; i <= k; i++) {
        double logTerme = lgamma(n + 1.0) - lgamma(i + 1.0) - lgamma(n - i + 1.0)
                        + i * log(p) + (n - i) * log(1.0 - p);
        somme += exp(logTerme);
    }
    return min(1.0, somme);
}

// SIMULATION 1 : ATTAQUE 51% & DOUBLE SPENDING AVEC RÉORGANISATION DE CHAÎNE
//
// attaque = false  -> blockchain de référence (aucun mineur malveillant)
// activerDefense   -> détection + finalité k-profondeur + vérification de chaîne
// Le détecteur ne voit QUE ce qui est public : la chaîne privée n'est connue
// qu'au moment où l'attaquant la publie (c'est là qu'on mesure la profondeur du fork).

ResultatAttaque simulerAttaque51(bool attaque, bool activerDefense, unsigned seed = 42,
                                 bool verbose = true, int puissanceAttaquant = 60) {
    ostream out(verbose ? cout.rdbuf() : nullptr);

    out << "\n-----------------------------------------------------------------\n";
    out << "  1. ATTAQUE 51% ET DOUBLE SPENDING (Reorganisation de chaine) \n";
    out << "  Mode : " << (!attaque ? "REFERENCE (Sans attaque)"
                         : activerDefense ? "PROTEGE (Avec Detection & Checkpointing)"
                                          : "VULNERABLE (Sans Defense)") << "\n";
    out << "-------------------------------------------------------------------\n";

    int nombreTours = 30;
    int difficulte = 2;
    int limiteReorgDefense = 3;     // Seuil max de réorganisation autorisé par la défense
    int confirmationsMarchand = 3;  // Le marchand livre le bien après 3 blocs honnêtes

    vector<Bloc> chaineHonnete;
    vector<Bloc> chaineAttaquant;

    chaineHonnete.push_back(creerGenesis());
    chaineAttaquant.push_back(creerGenesis());

    mt19937 generateur(seed); // Reproductibilité
    uniform_int_distribution<int> tirage(1, 100);

    Ledger grandLivreHonnete;
    Ledger grandLivreAttaquant;

    int blocsH = 0;
    int blocsA = 0;
    bool publie = false;
    int tourPublication = -1;

    for (int tour = 1; tour <= nombreTours; tour++) {
        int resultat = tirage(generateur);

        if (attaque && resultat <= puissanceAttaquant) {
            // L'attaquant mine en secret (chaîne privée)
            string tx;
            if (blocsA == 0) {
                tx = "TX CONFIDENTIELLE: Homam -> Houssam : 50 coins (Double Spend)";
                grandLivreAttaquant.executerTransaction("Homam", "Houssam", 50.0);
            } else {
                tx = "Bloc prive attaquant #" + to_string(blocsA);
            }
            ajouterBloc(chaineAttaquant, tx, difficulte, "Attaquant", tour);
            blocsA++;
        } else {
            // Le réseau honnête mine publiquement
            string tx;
            if (blocsH == 0) {
                tx = "TX PUBLIQUE: Homam -> Bilal : 50 coins (Achat d'un bien)";
                grandLivreHonnete.executerTransaction("Homam", "Bilal", 50.0);
            } else {
                tx = "Bloc reseau honnete #" + to_string(blocsH);
            }
            ajouterBloc(chaineHonnete, tx, difficulte, "Honnete", tour);
            blocsH++;
        }

        // L'attaquant publie dès que : le marchand a livré le bien (confirmations)
        // ET sa chaîne privée est plus longue que la chaîne publique.
        if (attaque && blocsH >= confirmationsMarchand &&
            chaineAttaquant.size() > chaineHonnete.size()) {
            publie = true;
            tourPublication = tour;
            break;
        }
    }

    out << "Tours de minage simules : " << nombreTours << "\n";
    out << "Blocs mines par le reseau honnete : " << blocsH << " (Longueur chaine : " << chaineHonnete.size() << ")\n";
    out << "Blocs mines par l'attaquant (secret) : " << blocsA << " (Longueur chaine : " << chaineAttaquant.size() << ")\n";

    out << "\n--- ETAT DU GRAND LIVRE AVANT REORGANISATION ---\n";
    out << "   [Soldes actuels] Homam: " << grandLivreHonnete.soldes.at("Homam")
        << " coins | Bilal (Marchand): " << grandLivreHonnete.soldes.at("Bilal")
        << " coins | Houssam: " << grandLivreHonnete.soldes.at("Houssam") << " coins\n";

    bool succesAttaque = false;
    bool detecte = false;
    int tempsDet = -1;
    double perte = 0.0;
    double surcout = 0.0;

    if (publie) {
        int reorgDepth = (int)chaineAttaquant.size() - 1;
        out << "\nL'attaquant publie sa chaine privee au tour " << tourPublication
            << " (profondeur du fork : " << reorgDepth << " blocs).\n";

        bool rejet = false;
        auto debut = Horloge::now();
        if (activerDefense) {
            // Vérification de la chaîne reçue + règle de finalité (profondeur max autorisée)
            bool valide = chaineValide(chaineAttaquant, difficulte);
            rejet = (!valide) || (reorgDepth > limiteReorgDefense);
            surcout = msDepuis(debut);
        }

        if (rejet) {
            // CONTRE-MESURE : Finalité k-profondeur / Checkpointing
            detecte = true;
            tempsDet = tourPublication;
            out << "\n[MODULE DE DETECTION] ALERTE : Tentative de reorganisation suspecte detectee !\n";
            out << "   Profondeur demandee : " << reorgDepth << " blocs (Seuil autorise : " << limiteReorgDefense << " blocs).\n";
            out << "   [DEFENSE ACTIVE] Rejet de la chaine privee clandestine !\n";
            out << "   -> L'attaque 51% a ete neutralisee par le protocole de finalite.\n";
        } else {
            // SANS DEFENSE : Longest chain rule naive
            out << "\n[VULNERABILITE] Règle naive de la chaine la plus longue appliquee !\n";
            out << "   Reorganisation massive de " << reorgDepth << " blocs...\n";
            chaineHonnete = chaineAttaquant;
            grandLivreHonnete = grandLivreAttaquant;
            out << "   -> ATTAQUE 51% REUSSIE : Double dépense confirmee !\n";
            succesAttaque = true;
            perte = 50.0; // Le marchand Bilal a livré le bien mais a perdu ses 50 coins
        }
    } else if (attaque) {
        out << "\nL'attaquant n'a pas reussi a depasser la chaine honnete.\n";
    } else {
        out << "\nAucune attaque : tous les blocs sont publics, aucune reorganisation.\n";
    }

    out << "\n--- ETAT DU GRAND LIVRE APRES REORGANISATION ---\n";
    out << "   [Soldes actuels] Homam: " << grandLivreHonnete.soldes.at("Homam")
        << " coins | Bilal (Marchand): " << grandLivreHonnete.soldes.at("Bilal")
        << " coins | Houssam: " << grandLivreHonnete.soldes.at("Houssam") << " coins\n";

    return {"Attaque 51% & Double Spending", succesAttaque, detecte, tempsDet, perte, surcout, 0.0};
}

// SIMULATION 2 : SELFISH MINING (Eyal & Sirer)
//
// Machine à états complète : avance privée + état d'égalité (fork 0') résolu par gamma.
// Détection ADAPTATIVE : taux d'orphelins sur fenêtre glissante comparé au seuil
// appris sur la blockchain de référence (moyenne + 4 écarts-types).
// Mitigation : (1) tie-breaking uniforme (gamma = 0.5) en permanence,
//              (2) après alerte, rejet des salves de >= 2 blocs qui écrasent un bloc public.

ResultatAttaque simulerSelfishMining(bool attaque, bool activerDefense, unsigned seed = 42,
                                     bool verbose = true, double alpha = 0.35,
                                     double gammaAttaque = 0.7, int nombreTours = 500,
                                     vector<double>* sortieTaux = nullptr) {
    ostream out(verbose ? cout.rdbuf() : nullptr);

    out << "\n-----------------------------------------------------------------\n";
    out << "  2. SELFISH MINING (Minage Egoiste - Strategie Eyal & Sirer)   \n";
    out << "  Mode : " << (!attaque ? "REFERENCE (Sans attaque)"
                         : activerDefense ? "PROTEGE (Tie-breaking uniforme & rejet des salves)"
                                          : "VULNERABLE (Sans Defense)") << "\n";
    out << "-------------------------------------------------------------------\n";

    double gamma = activerDefense ? 0.5 : gammaAttaque; // tie-breaking uniforme => gamma = 0.5
    const double pOrphelinNaturel = 0.02; // forks naturels dus à la latence réseau
    const int fenetre = 50;

    mt19937 generateur(seed);
    uniform_real_distribution<double> dist(0.0, 1.0);

    int avance = 0;          // avance privée de l'attaquant
    bool egalite = false;    // fork de même hauteur en cours (état 0')
    int blocsAttaquantReconnus = 0;
    int blocsHonnetesReconnus = 0;
    int blocsOrphelins = 0;
    int tourDetection = -1;
    bool mitigation = false;
    double surcout = 0.0;
    vector<int> cumulOrphelins(nombreTours + 1, 0);

    for (int tour = 1; tour <= nombreTours; tour++) {
        double r = dist(generateur);

        if (r < alpha) {
            if (!attaque) {
                // Référence : le mineur minoritaire est honnête, il publie tout de suite
                blocsAttaquantReconnus++;
                if (dist(generateur) < pOrphelinNaturel) blocsOrphelins++;
            } else if (egalite) {
                // L'attaquant trouve le bloc qui départage : il publie ses 2 blocs d'un coup
                if (mitigation) {
                    blocsHonnetesReconnus += 1;
                    blocsOrphelins += 2;
                } else {
                    blocsAttaquantReconnus += 2;
                    blocsOrphelins += 1;
                }
                egalite = false;
                avance = 0;
            } else {
                // L'attaquant égoïste trouve un bloc et le garde secret
                avance++;
            }
        } else {
            // Le réseau honnête trouve un bloc
            if (egalite) {
                // Le bloc honnête étend l'une des deux branches : gamma = part qui suit l'attaquant
                if (dist(generateur) < gamma) {
                    blocsAttaquantReconnus += 1;
                    blocsHonnetesReconnus += 1;
                } else {
                    blocsHonnetesReconnus += 2;
                }
                blocsOrphelins += 1;
                egalite = false;
            } else if (avance == 0) {
                // Pas de chaîne privée, les honnêtes valident leur bloc
                blocsHonnetesReconnus++;
                if (dist(generateur) < pOrphelinNaturel) blocsOrphelins++;
            } else if (avance == 1) {
                // L'attaquant publie son bloc : course à hauteur égale (Fork de longueur 1)
                egalite = true;
                avance = 0;
            } else if (avance == 2) {
                if (mitigation) {
                    // Contre-mesure : salve de 2 blocs rejetée après alerte
                    blocsHonnetesReconnus += 1;
                    blocsOrphelins += 2;
                } else {
                    // L'attaquant publie toute sa branche pour écraser les blocs honnêtes
                    blocsAttaquantReconnus += 2;
                    blocsOrphelins += 1;
                }
                avance = 0;
            } else {
                // Avance > 2 : l'attaquant publie 1 bloc pour invalider celui du réseau
                if (mitigation) {
                    blocsHonnetesReconnus += 1;
                    avance = 0; // Réorganisation rejetée par la règle de finalité
                } else {
                    blocsAttaquantReconnus += 1;
                    blocsOrphelins += 1;
                    avance--;
                }
            }
        }

        // Détection adaptative par analyse du taux d'orphelins (fenêtre glissante)
        cumulOrphelins[tour] = blocsOrphelins;
        if (tour >= fenetre) {
            auto t0 = Horloge::now();
            double tauxFenetre = (double)(cumulOrphelins[tour] - cumulOrphelins[tour - fenetre]) / fenetre;
            if (sortieTaux) sortieTaux->push_back(tauxFenetre);
            if (activerDefense && tourDetection == -1 && tauxFenetre > g_seuils.orphelinsSelfish) {
                tourDetection = tour;
                mitigation = true;
            }
            if (activerDefense) surcout += msDepuis(t0);
        }
    }

    // Publication des blocs privés restants en fin de simulation
    if (attaque && !mitigation) blocsAttaquantReconnus += avance;

    int totalReconnus = blocsAttaquantReconnus + blocsHonnetesReconnus;
    double partReelle = totalReconnus > 0 ? (double)blocsAttaquantReconnus / totalReconnus : 0.0;
    double tauxOrphelins = (double)blocsOrphelins / nombreTours;

    out << "Hashrate theorique attaquant (alpha) : " << (alpha * 100) << "%\n";
    out << "Part des recompenses obtenues       : " << (partReelle * 100) << "%\n";
    out << "Taux de blocs orphelins generes     : " << (tauxOrphelins * 100) << "%\n";
    if (tourDetection > 0)
        out << "Alerte du detecteur adaptatif au bloc #" << tourDetection
            << " (seuil appris : " << g_seuils.orphelinsSelfish * 100 << "% d'orphelins)\n";

    bool succes = attaque && (partReelle > alpha + 0.02); // Rentable si gain significativement supérieur au hashrate
    if (attaque)
        out << "Resultat : " << (succes ? "L'ATTAQUANT SURPASSE SON HASHRATE (Selfish Mining reussi)"
                                         : "ATTAQUE NEUTRALISEE (Gain aligne ou inferieur au hashrate)") << "\n";
    else
        out << "Resultat : reference, part de l'attaquant potentiel ~ son hashrate.\n";

    // Perte des mineurs honnêtes = récompenses captées en excès par l'attaquant (6.25 coins / bloc)
    double perte = succes ? (partReelle - alpha) * totalReconnus * 6.25 : 0.0;

    return {"Selfish Mining (Eyal & Sirer)", succes, tourDetection > 0, tourDetection,
            perte, surcout, partReelle};
}

// SIMULATION 3 : BLOCK WITHHOLDING ATTACK (Pool de Minage)
//
// Pool de 15 mineurs : le mineur 0 est l'attaquant potentiel (puissanceAttaquantPool %).
// Détection : pour CHAQUE mineur, test binomial unilatéral sur son nombre de blocs complets
// comparé au taux de blocs estimé sur les AUTRES mineurs (aucune connaissance a priori de l'attaquant).
// Seuil corrigé par Bonferroni : 1% / nombre de mineurs.

ResultatAttaque simulerBlockWithholding(bool attaque, bool activerDefense, unsigned seed = 777,
                                        bool verbose = true, int puissanceAttaquantPool = 30) {
    ostream out(verbose ? cout.rdbuf() : nullptr);

    out << "\n-----------------------------------------------------------------\n";
    out << "  3. BLOCK WITHHOLDING ATTACK (BWH - Pool de Minage)           \n";
    out << "  Mode : " << (!attaque ? "REFERENCE (Sans attaque)"
                         : activerDefense ? "PROTEGE (Audit statistique Rosenfeld)"
                                          : "VULNERABLE (Sans Defense)") << "\n";
    out << "-------------------------------------------------------------------\n";

    const int nombreTours = 1000;
    const int nbMineurs = 15;
    const double probaFullBlock = 0.05; // 5% des shares sont des blocs complets valides pour le réseau
    const int sharesMin = 30;           // échantillon minimal avant de tester un mineur
    const double seuilPValue = 0.01 / nbMineurs;

    mt19937 generateur(seed);
    uniform_real_distribution<double> distMineur(0.0, 100.0);
    uniform_real_distribution<double> distProof(0.0, 1.0);

    double partHonnete = (100.0 - puissanceAttaquantPool) / (nbMineurs - 1);

    vector<int> shares(nbMineurs, 0), blocs(nbMineurs, 0);
    vector<bool> exclu(nbMineurs, false);
    int blocsCompletsHonnetes = 0;
    int blocsCompletsRetenus = 0; // Blocs détruits par l'attaquant
    int tempsDet = -1;
    double surcout = 0.0;

    for (int t = 1; t <= nombreTours; t++) {
        double tirage = distMineur(generateur);
        int m = (tirage < puissanceAttaquantPool) ? 0 : 1 + (int)((tirage - puissanceAttaquantPool) / partHonnete);
        if (m >= nbMineurs) m = nbMineurs - 1;
        bool estBlocComplet = (distProof(generateur) < probaFullBlock);

        if (exclu[m]) continue; // mineur banni : ses shares ne sont plus acceptés

        shares[m]++;
        if (estBlocComplet) {
            if (m == 0 && attaque) {
                // Attaque BWH : l'attaquant détruit le bloc complet au lieu de le soumettre
                blocsCompletsRetenus++;
            } else {
                blocs[m]++;
                blocsCompletsHonnetes++;
            }
        }

        // Détection adaptative : taux de référence estimé sur les autres mineurs
        if (activerDefense && shares[m] >= sharesMin) {
            auto t0 = Horloge::now();
            int sharesAutres = 0, blocsAutres = 0;
            for (int i = 0; i < nbMineurs; i++) {
                if (i != m && !exclu[i]) {
                    sharesAutres += shares[i];
                    blocsAutres += blocs[i];
                }
            }
            if (sharesAutres > 0) {
                double pEstime = (double)blocsAutres / sharesAutres;
                double pValue = cdfBinomiale(blocs[m], shares[m], pEstime);
                if (pValue < seuilPValue) {
                    exclu[m] = true;
                    if (m == 0 && tempsDet == -1) tempsDet = t;
                }
            }
            surcout += msDepuis(t0);
        }
    }

    out << "Shares soumis - Attaquant potentiel : " << shares[0] << " | Autres mineurs : "
        << accumulate(shares.begin() + 1, shares.end(), 0) << "\n";
    out << "Blocs complets valides soumis au reseau : " << blocsCompletsHonnetes << "\n";
    out << "Blocs complets retenus (sabotes par l'attaquant) : " << blocsCompletsRetenus << "\n";

    bool autreExclu = false;
    for (int i = 1; i < nbMineurs; i++) if (exclu[i]) autreExclu = true;
    bool detecte = attaque ? exclu[0] : (exclu[0] || autreExclu);

    double pertePool = blocsCompletsRetenus * 50.0; // 50 coins par bloc perdu

    if (activerDefense && detecte && attaque) {
        out << "\n[MODULE DE DETECTION] ALERTE STATISTIQUE : Anomalie BWH detectee au tour #" << tempsDet << " !\n";
        out << "   Ratio Blocs/Shares anormalement bas pour le mineur suspect.\n";
        out << "   [DEFENSE ACTIVE] Exclusion du mineur saboteur : les pertes sont limitees a "
            << pertePool << " coins (avant detection).\n";
    } else if (attaque && pertePool > 0) {
        out << "\n[VULNERABILITE] La pool remunere l'attaquant sans verifier la distribution des blocs complets.\n";
        out << "   -> ATTAQUE BWH REUSSIE : " << pertePool << " coins perdus par la pool de minage !\n";
    } else if (!attaque) {
        out << "\nAucune attaque : tous les mineurs soumettent leurs blocs complets.\n";
    }

    // Attaque neutralisée = attaquant exclu ; sinon elle réussit dès qu'elle fait perdre des blocs
    bool succes = attaque && pertePool > 0 && !(activerDefense && detecte);

    return {"Block Withholding (BWH)", succes, detecte, detecte && attaque ? tempsDet : -1,
            pertePool, surcout, 0.0};
}

// SIMULATION 4 : SYBIL ATTACK DANS UN RÉSEAU P2P SIMULÉ

struct NoeudP2P {
    int id;
    string sousReseau;
    bool estSybil;
    bool estHonnete;
};

// Détection : concentration des candidats par sous-réseau (seuil appris en référence).
// Mitigation : 1 pair maximum par sous-réseau (diversité topologique).
// nbSousReseauxSybil : l'attaquant peut répartir ses identités sur plusieurs sous-réseaux.

ResultatAttaque simulerSybilAttack(bool attaque, bool activerDefense, unsigned seed = 999,
                                   bool verbose = true, int nbHonnetes = 10, int nbSybil = 40,
                                   int nbSousReseauxSybil = 1, double* concentrationMax = nullptr) {
    ostream out(verbose ? cout.rdbuf() : nullptr);

    out << "\n-----------------------------------------------------------------\n";
    out << "  4. SYBIL ATTACK / ECLIPSE (Reseau P2P Simule)               \n";
    out << "  Mode : " << (!attaque ? "REFERENCE (Sans attaque)"
                         : activerDefense ? "PROTEGE (Diversite IP / Sous-reseaux & detection)"
                                          : "VULNERABLE (Sans Defense)") << "\n";
    out << "-------------------------------------------------------------------\n";

    int maxConnexionsVictime = 8;
    vector<NoeudP2P> pairsCandidats;

    mt19937 g(seed);
    uniform_int_distribution<int> distSousReseau(1, 200);

    // Pairs honnêtes répartis sur différents sous-réseaux
    for (int i = 1; i <= nbHonnetes; i++) {
        pairsCandidats.push_back({i, "192.168." + to_string(distSousReseau(g)) + ".0/24", false, true});
    }

    // L'attaquant injecte des identités Sybil provenant de peu de sous-réseaux
    if (attaque) {
        for (int i = 0; i < nbSybil; i++) {
            pairsCandidats.push_back({nbHonnetes + 1 + i,
                                      "10." + to_string(i % max(1, nbSousReseauxSybil)) + ".0.0/16",
                                      true, false});
        }
    }

    shuffle(pairsCandidats.begin(), pairsCandidats.end(), g);

    vector<NoeudP2P> tableConnexions;
    map<string, int> connexionsParSousReseau;
    map<string, int> vusParSousReseau;

    int sybilConnectes = 0;
    int candidatsVus = 0;
    int maxVu = 0;
    double concMax = 0.0;
    bool detecte = false;
    int tempsDet = -1;
    double surcout = 0.0;

    for (const auto& candidat : pairsCandidats) {
        auto t0 = Horloge::now();

        // Observation : concentration des candidats par sous-réseau
        candidatsVus++;
        maxVu = max(maxVu, ++vusParSousReseau[candidat.sousReseau]);
        if (candidatsVus >= 8) {
            double part = (double)maxVu / candidatsVus;
            concMax = max(concMax, part);
            if (activerDefense && !detecte && part > g_seuils.concentrationSybil) {
                detecte = true;
                tempsDet = candidatsVus;
            }
        }

        // Décision de connexion
        if (tableConnexions.size() < (size_t)maxConnexionsVictime) {
            bool rejete = false;
            if (activerDefense) {
                // CONTRE-MESURE SYBIL : Limite stricte de 1 peer par sous-réseau
                if (connexionsParSousReseau[candidat.sousReseau] >= 1) rejete = true;
            }
            if (!rejete) {
                tableConnexions.push_back(candidat);
                connexionsParSousReseau[candidat.sousReseau]++;
                if (candidat.estSybil) sybilConnectes++;
            }
        }

        if (activerDefense) surcout += msDepuis(t0);
    }

    if (concentrationMax) *concentrationMax = concMax;

    out << "Nombre de slots de connexion de la cible : " << maxConnexionsVictime << "\n";
    out << "Noeuds Sybil ayant infiltre la victime  : " << sybilConnectes << " / " << maxConnexionsVictime << "\n";

    bool eclipseReussi = attaque && (sybilConnectes >= 6); // Au moins 75% des pairs sous contrôle adverse

    if (!attaque) {
        out << "\nAucune attaque : la victime est connectee uniquement a des pairs honnetes.\n";
    } else if (eclipseReussi) {
        out << "\n[VULNERABILITE] ECLIPSE / SYBIL ATTACK REUSSIE !\n";
        out << "   La victime est saturee par les noeuds de l'attaquant (" << (sybilConnectes * 100 / maxConnexionsVictime) << "% des connexions),\n";
        out << "   permettant la censure de transactions et l'injection de faux blocs.\n";
    } else if (activerDefense) {
        out << "\n[DEFENSE ACTIVE] Diversite topologique garantie :\n";
        out << "   Maximum 1 pair par sous-reseau. Les entites Sybil n'ont obtenu que " << sybilConnectes << " slot(s) sur " << maxConnexionsVictime << ".\n";
        out << "   -> ATTAQUE SYBIL NEUTRALISEE : La victime reste synchronisee avec les noeuds honnetes.\n";
    } else {
        out << "\nEclipse non atteinte (moins de 6 slots controles par l'attaquant).\n";
    }

    return {"Sybil / Eclipse Attack", eclipseReussi, detecte, tempsDet,
            eclipseReussi ? 120.0 : 0.0, // Perte due à l'isolation et à la censure
            surcout, 0.0};
}

// PARTIE 3 : CALIBRATION ADAPTATIVE DES SEUILS (NOUVEAU)
// Les seuils sont appris sur des exécutions de RÉFÉRENCE (graines distinctes de l'évaluation).

void calibrerSeuils(int nbRuns) {
    vector<double> tauxOrphelins, concentrations;

    for (int i = 0; i < nbRuns; i++) {
        unsigned seed = 100000 + i;

        vector<double> taux;
        simulerSelfishMining(false, false, seed, false, 0.35, 0.7, 500, &taux);
        tauxOrphelins.insert(tauxOrphelins.end(), taux.begin(), taux.end());

        double conc = 0.0;
        simulerSybilAttack(false, false, seed, false, 10, 40, 1, &conc);
        concentrations.push_back(conc);
    }

    g_seuils.orphelinsSelfish = moyenne(tauxOrphelins) + 4.0 * ecartType(tauxOrphelins);
    g_seuils.concentrationSybil = min(0.95, moyenne(concentrations) + 4.0 * ecartType(concentrations));

    cout << "\n[CALIBRATION] Seuils appris sur la blockchain de reference (" << nbRuns << " executions) :\n";
    cout << "   Selfish Mining : taux d'orphelins (fenetre 50) > " << g_seuils.orphelinsSelfish * 100 << "%\n";
    cout << "   Sybil          : part max d'un sous-reseau   > " << g_seuils.concentrationSybil * 100 << "%\n";
}

// PARTIE 4 : ÉVALUATION EXPÉRIMENTALE ET SYNTHÈSE SCIENTIFIQUE

using Simulation = function<ResultatAttaque(bool, bool, unsigned)>;

struct Evaluation {
    string nom;
    double succesRef, succesAtt, succesProt;   // taux de réussite de l'attaque (%)
    double pertesAtt, pertesProt;              // pertes moyennes (coins)
    double precision, rappel, fauxPositifs;    // %
    double tempsDetection, surcoutMs;
};

// Pour chaque graine : référence, référence + détecteur (faux positifs),
// attaquée sans défense, attaquée avec défense (même graine => comparaison équitable).
Evaluation evaluer(const string& nom, const Simulation& sim, int nbRuns) {
    int succRef = 0, succAtt = 0, succProt = 0, tp = 0, fp = 0, fn = 0;
    vector<double> pertesAtt, pertesProt, temps, surcouts;

    for (int i = 1; i <= nbRuns; i++) {
        unsigned seed = i;
        ResultatAttaque ref = sim(false, false, seed);
        ResultatAttaque refDet = sim(false, true, seed);
        ResultatAttaque att = sim(true, false, seed);
        ResultatAttaque pro = sim(true, true, seed);

        succRef += ref.succes;
        succAtt += att.succes;
        succProt += pro.succes;
        pertesAtt.push_back(att.pertesEconomiques);
        pertesProt.push_back(pro.pertesEconomiques);
        surcouts.push_back(pro.surcoutDefenseMs);

        if (pro.detecte) { tp++; temps.push_back(pro.tempsDetection); } else { fn++; }
        if (refDet.detecte) fp++;
    }

    Evaluation e;
    e.nom = nom;
    e.succesRef = 100.0 * succRef / nbRuns;
    e.succesAtt = 100.0 * succAtt / nbRuns;
    e.succesProt = 100.0 * succProt / nbRuns;
    e.pertesAtt = moyenne(pertesAtt);
    e.pertesProt = moyenne(pertesProt);
    e.precision = (tp + fp > 0) ? 100.0 * tp / (tp + fp) : 0.0;
    e.rappel = (tp + fn > 0) ? 100.0 * tp / (tp + fn) : 0.0;
    e.fauxPositifs = 100.0 * fp / nbRuns;
    e.tempsDetection = moyenne(temps);
    e.surcoutMs = moyenne(surcouts);
    return e;
}

void afficherTableauComparatif(const vector<Evaluation>& evals, int nbRuns) {
    cout << "\n\n";
    cout << string(150, '-') << "\n";
    cout << "   SYNTHESE SCIENTIFIQUE : BLOCKCHAIN DE REFERENCE vs ATTAQUEE vs PROTEGEE  ("
         << nbRuns << " executions par cas, graines 1.." << nbRuns << ")\n";
    cout << string(150, '-') << "\n";

    cout << left << setw(32) << "Attaque Simulee"
         << setw(9) << "Succes"
         << setw(9) << "Succes"
         << setw(9) << "Succes"
         << setw(11) << "Precision"
         << setw(9) << "Rappel"
         << setw(9) << "Faux +"
         << setw(12) << "Temps Det."
         << setw(13) << "Surcout"
         << setw(13) << "Pertes"
         << setw(13) << "Pertes" << "\n";
    cout << left << setw(32) << ""
         << setw(9) << "Ref."
         << setw(9) << "Attaq."
         << setw(9) << "Prot."
         << setw(11) << "(%)"
         << setw(9) << "(%)"
         << setw(9) << "(%)"
         << setw(12) << "(moyen)"
         << setw(13) << "(ms/exec.)"
         << setw(13) << "Attaquee"
         << setw(13) << "Protegee" << "\n";
    cout << string(150, '-') << "\n";

    cout << fixed << setprecision(1);
    for (const auto& e : evals) {
        cout << left << setw(32) << e.nom
             << setw(9) << (to_string((int)round(e.succesRef)) + "%")
             << setw(9) << (to_string((int)round(e.succesAtt)) + "%")
             << setw(9) << (to_string((int)round(e.succesProt)) + "%");
        cout << setw(11) << e.precision
             << setw(9) << e.rappel
             << setw(9) << e.fauxPositifs
             << setw(12) << e.tempsDetection;
        cout << setw(13) << setprecision(4) << e.surcoutMs << setprecision(1)
             << setw(13) << e.pertesAtt
             << setw(13) << e.pertesProt << "\n";
    }

    cout << string(150, '-') << "\n";
    double perteSans = 0.0, perteAvec = 0.0;
    for (const auto& e : evals) { perteSans += e.pertesAtt; perteAvec += e.pertesProt; }
    cout << "Pertes financieres moyennes cumulees (une execution de chaque attaque) :\n";
    cout << " - Blockchain Non Protegee : " << perteSans << " coins perdus\n";
    cout << " - Blockchain Protegee     : " << perteAvec << " coins perdus";
    if (perteSans > 0) cout << " (reduction de " << 100.0 * (1.0 - perteAvec / perteSans) << "%)";
    cout << "\n";
    cout << "Unites du temps de detection : tours (51%, Selfish, BWH) ou candidats observes (Sybil).\n";
    cout << "Precision calculee avec autant d'executions attaquees que d'executions de reference.\n";
    cout << string(150, '-') << "\n\n";
}

// Balayage d'un paramètre (nombre de sous-réseaux, hashrate, ...) exporté en CSV
// pour tracer les courbes du rapport (Python / Excel / gnuplot).

using SimulationParam = function<ResultatAttaque(double, bool, bool, unsigned)>;

void balayage(const string& fichier, const string& nomParam, const vector<double>& valeurs,
              const SimulationParam& sim, int nbRuns) {
    ofstream csv(fichier);
    csv << nomParam << ",succes_vulnerable_pct,succes_protege_pct,pertes_vulnerable,pertes_protege,"
        << "part_vulnerable,part_protege,rappel_detection_pct,faux_positifs_pct\n";

    cout << "\nBalayage '" << nomParam << "' -> " << fichier << "\n";
    cout << left << setw(12) << nomParam << setw(18) << "Succes vuln.(%)"
         << setw(18) << "Succes prot.(%)" << setw(16) << "Rappel(%)" << setw(14) << "Faux +(%)" << "\n";

    for (double v : valeurs) {
        int succV = 0, succP = 0, tp = 0, fp = 0;
        vector<double> pertV, pertP, partV, partP;

        for (int i = 1; i <= nbRuns; i++) {
            unsigned seed = i;
            ResultatAttaque att = sim(v, true, false, seed);
            ResultatAttaque pro = sim(v, true, true, seed);
            ResultatAttaque refDet = sim(v, false, true, seed);

            succV += att.succes;
            succP += pro.succes;
            pertV.push_back(att.pertesEconomiques);
            pertP.push_back(pro.pertesEconomiques);
            partV.push_back(att.partRecompenses);
            partP.push_back(pro.partRecompenses);
            if (pro.detecte) tp++;
            if (refDet.detecte) fp++;
        }

        double sV = 100.0 * succV / nbRuns, sP = 100.0 * succP / nbRuns;
        double rappel = 100.0 * tp / nbRuns, faux = 100.0 * fp / nbRuns;

        csv << v << "," << sV << "," << sP << "," << moyenne(pertV) << "," << moyenne(pertP) << ","
            << moyenne(partV) << "," << moyenne(partP) << "," << rappel << "," << faux << "\n";

        cout << left << setw(12) << v << setw(18) << sV << setw(18) << sP
             << setw(16) << rappel << setw(14) << faux << "\n";
    }
}

// FONCTION PRINCIPALE

int main(int argc, char* argv[]) {
    // Usage : ./atelier2 [nombre_d_executions]   (50 par défaut)
    int nbRuns = (argc > 1) ? max(1, atoi(argv[1])) : 50;

    cout << "-----------------------------------------------\n";
    cout << "*  ATELIER 2 : PLATEFORME EXPERIMENTALE DE SIMULATION D'ATTAQUES BLOCKCHAIN    *\n";
    cout << "*  ET SYSTEME ADAPTATIF DE DETECTION / MITIGATION                             *\n";
    cout << "-----------------------------------------------\n";

    cout << "\nExecution de l'evaluation experimentale complete (Mode 3 etats) :\n";
    cout << " 1. Blockchain de Reference (Sans attaque)\n";
    cout << " 2. Blockchain Attaquee (Sans defense)\n";
    cout << " 3. Blockchain Protegee (Avec Detection & Mitigation)\n";

    // 0. Apprentissage des seuils adaptatifs sur la référence
    calibrerSeuils(30);

    // 1. Démonstration détaillée (une exécution par attaque : attaquée puis protégée)
    simulerAttaque51(true, false, 42, true);
    simulerAttaque51(true, true, 42, true);

    simulerSelfishMining(true, false, 42, true);
    simulerSelfishMining(true, true, 42, true);

    simulerBlockWithholding(true, false, 777, true);
    simulerBlockWithholding(true, true, 777, true);

    simulerSybilAttack(true, false, 999, true);
    simulerSybilAttack(true, true, 999, true);

    // 2. Évaluation statistique sur nbRuns exécutions (référence / attaquée / protégée)
    vector<Evaluation> evals;
    evals.push_back(evaluer("Attaque 51% & Double Spending",
        [](bool a, bool d, unsigned s) { return simulerAttaque51(a, d, s, false); }, nbRuns));
    evals.push_back(evaluer("Selfish Mining (Eyal & Sirer)",
        [](bool a, bool d, unsigned s) { return simulerSelfishMining(a, d, s, false); }, nbRuns));
    evals.push_back(evaluer("Block Withholding (BWH)",
        [](bool a, bool d, unsigned s) { return simulerBlockWithholding(a, d, s, false); }, nbRuns));
    evals.push_back(evaluer("Sybil / Eclipse Attack",
        [](bool a, bool d, unsigned s) { return simulerSybilAttack(a, d, s, false); }, nbRuns));
    afficherTableauComparatif(evals, nbRuns);

    // 3. Balayages de paramètres (validation scientifique) -> fichiers CSV
    balayage("balayage_51_hashrate.csv", "hashrate_pct", {30, 40, 45, 50, 55, 60, 70},
        [](double v, bool a, bool d, unsigned s) { return simulerAttaque51(a, d, s, false, (int)v); }, nbRuns);

    balayage("balayage_selfish_alpha.csv", "alpha", {0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.45},
        [](double v, bool a, bool d, unsigned s) { return simulerSelfishMining(a, d, s, false, v); }, nbRuns);

    balayage("balayage_selfish_gamma.csv", "gamma", {0.0, 0.25, 0.5, 0.75, 1.0},
        [](double v, bool a, bool d, unsigned s) { return simulerSelfishMining(a, d, s, false, 0.35, v); }, nbRuns);

    balayage("balayage_bwh_puissance.csv", "puissance_pool_pct", {10, 20, 30, 40},
        [](double v, bool a, bool d, unsigned s) { return simulerBlockWithholding(a, d, s, false, (int)v); }, nbRuns);

    balayage("balayage_sybil_sousreseaux.csv", "sous_reseaux_sybil", {1, 2, 4, 8, 16},
        [](double v, bool a, bool d, unsigned s) { return simulerSybilAttack(a, d, s, false, 10, 40, (int)v); }, nbRuns);

    cout << "\nFichiers CSV generes : utilisez-les pour tracer les graphiques du rapport.\n";

    return 0;
}