#include <iostream>
#include <string>
#include <sstream>
#include <iomanip>
#include <cstdint> 
#include <chrono> // pour mesurer le temps d'exécution

using namespace std;

string hashTexte(const string& texte) { // Fonction pour hasher une chaîne de caractères
    uint64_t hash = 14695981039346656037ULL;

    for (unsigned char c : texte) { // Parcourt chaque caractère de la chaîne
        hash ^= c;
        hash *= 1099511628211ULL;
    }

    stringstream sortie;
    sortie << hex << setfill('0') << setw(16) << hash;

    return sortie.str();
}

struct Bloc { // Structure représentant un bloc dans la blockchain
    int index;
    string donnees;
    string hashPrecedent;
    uint64_t nonce;
    string hash;

    string calculerHash() const { // Fonction pour calculer le hash du bloc
        return hashTexte(
            to_string(index) +
            donnees +
            hashPrecedent +
            to_string(nonce)
        );
    }

    void miner(int difficulte) { // Fonction pour miner le bloc en trouvant un nonce qui satisfait la difficulté
        string cible(difficulte, '0');
        nonce = 0;

        while (true) { // Boucle infinie jusqu'à ce qu'un hash valide soit trouvé
            hash = calculerHash();

            if (hash.substr(0, difficulte) == cible) {
                break;
            }

            nonce++;
        }
    }
};

int main() {
    cout << "=== Proof of Work ===\n";

    for (int difficulte = 1; difficulte <= 4; difficulte++) {
        Bloc bloc{
            1,
            "Transaction Alice->Bob:10",
            "0000000000000000",
            0,
            ""
        };

        auto debut = chrono::steady_clock::now();

        bloc.miner(difficulte);

        auto fin = chrono::steady_clock::now();

        double temps = chrono::duration<double, milli>(
            fin - debut
        ).count();

        cout << "\nDifficulte : " << difficulte << "\n";
        cout << "Nonce : " << bloc.nonce << "\n";
        cout << "Hash : " << bloc.hash << "\n";
        cout << "Temps : " << temps << " ms\n";
    }

    return 0;
}