#include <iostream>
#include <string>
#include <vector>
#include <random>
#include <chrono>
#include <sstream>
#include <iomanip>
#include <cstdint>

using namespace std;

string hashTexte(const string& texte) { // Fonction pour hasher une chaîne de caractères
    uint64_t hash = 14695981039346656037ULL;

    for (unsigned char c : texte) {
        hash ^= c;
        hash *= 1099511628211ULL;
    }

    stringstream sortie;
    sortie << hex << setfill('0') << setw(16) << hash;

    return sortie.str();
}

struct Validateur { // Structure représentant un validateur dans le système Proof of Stake
    string nom;
    int mise;
};

int choisirPoS(const vector<Validateur>& validateurs) { // Fonction pour choisir un validateur en utilisant le mécanisme Proof of Stake
    int total = 0;

    for (const auto& v : validateurs) { // Calcule le total des mises de tous les validateurs
        total += v.mise;
    }

    random_device rd; 
    mt19937 generateur(rd());

    uniform_int_distribution<int> tirage(1, total);

    int numero = tirage(generateur);
    int cumul = 0;

    for (size_t i = 0; i < validateurs.size(); i++) { // Parcourt les validateurs pour trouver celui qui correspond au numéro tiré
        cumul += validateurs[i].mise;

        if (numero <= cumul) {
            return static_cast<int>(i);
        }
    }

    return 0;
}

int main() {
    vector<Validateur> validateurs = {
        {"Alice", 60},
        {"Bob", 30},
        {"Carla", 10}
    };

    cout << "=== Comparaison PoS et PoW ===\n";

    auto debutPoS = chrono::steady_clock::now();

    int gagnant = choisirPoS(validateurs);

    auto finPoS = chrono::steady_clock::now();

    double tempsPoS = chrono::duration<double, micro>(
        finPoS - debutPoS
    ).count();

    cout << "Validateur choisi : "
         << validateurs[gagnant].nom << "\n";

    cout << "Temps PoS : "
         << tempsPoS << " microsecondes\n";

    auto debutPoW = chrono::steady_clock::now();

    uint64_t nonce = 0;
    string hash;
    int difficulte = 3;

    do {
        hash = hashTexte(
            "bloc-demo" + to_string(nonce)
        );

        if (hash.substr(0, difficulte) == "000") {
            break;
        }

        nonce++;

    } while (true);

    auto finPoW = chrono::steady_clock::now();

    double tempsPoW = chrono::duration<double, micro>(
        finPoW - debutPoW
    ).count();

    cout << "Nonce PoW : " << nonce << "\n";
    cout << "Hash PoW : " << hash << "\n";

    cout << "Temps PoW : "
         << tempsPoW << " microsecondes\n";

    if (tempsPoS < tempsPoW) {
        cout << "PoS est plus rapide dans ce test.\n";
    } else {
        cout << "PoW est plus rapide dans ce test.\n";
    }

    return 0;
}