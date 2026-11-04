#include <iostream>
#include <string>
#include <vector>
#include <sstream>
#include <iomanip> // pour appeler setfill et setw
#include <cstdint> // pour appeler uint64_t

using namespace std;

string hashTexte(const string& texte) {  // Fonction pour hasher une chaîne de caractères
    uint64_t hash = 14695981039346656037ULL; 

    for (unsigned char c : texte) { // Parcourt chaque caractère de la chaîne
        hash ^= c;
        hash *= 1099511628211ULL;
    }

    stringstream sortie;
    sortie << hex << setfill('0') << setw(16) << hash; // Convertit le hash en chaîne hexadécimale

    return sortie.str();
}

string hashPair(const string& gauche, const string& droite) { // Fonction pour hasher une paire de chaînes
    return hashTexte(gauche + droite);
}

string racineMerkle(vector<string> transactions) { // Fonction pour calculer la racine de Merkle à partir d'une liste de transactions
    if (transactions.empty()) {
        return hashTexte("");
    }

    for (string& transaction : transactions) { // Hash chaque transaction individuellement
        transaction = hashTexte(transaction);
    }

    while (transactions.size() > 1) {
        vector<string> suivant;

        for (size_t i = 0; i < transactions.size(); i += 2) { // Parcourt les transactions par paires
            string gauche = transactions[i];

            string droite;

            if (i + 1 < transactions.size()) {
                droite = transactions[i + 1];
            } else {
                droite = gauche;
            }

            suivant.push_back(hashPair(gauche, droite));
        }

        transactions = suivant;
    }

    return transactions[0];
}

int main() {
    vector<string> transactions = {
        "Alice->Bob:10",
        "Bob->Carla:5",
        "Carla->David:2",
        "David->Alice:1"
    };

    cout << "=== Arbre de Merkle ===\n";

    for (size_t i = 0; i < transactions.size(); i++) {
        cout << "Transaction " << i + 1 << " : "
             << transactions[i] << "\n";

        cout << "Hash : "
             << hashTexte(transactions[i]) << "\n";
    }

    string racine1 = racineMerkle(transactions);

    cout << "\nRacine Merkle : " << racine1 << "\n";

    transactions[1] = "Bob->Carla:50";

    string racine2 = racineMerkle(transactions);

    cout << "Racine apres modification : "
         << racine2 << "\n";

    cout << "Racine modifiee ? "
         << (racine1 != racine2 ? "Oui" : "Non")
         << "\n";

    return 0;
}