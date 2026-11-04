#include <iostream>
#include <iomanip>
#include <sstream>
#include <string>
#include <vector>
#include <map>
#include <random>
#include <chrono>
#include <ctime>
#include <cstdint>
using namespace std;
using Clock = chrono::steady_clock;

class SHA256 {
    static inline uint32_t rotr(uint32_t x, int n) { return (x >> n) | (x << (32 - n)); }
    static void transform(uint32_t h[8], const uint8_t block[64]) {
        static const uint32_t K[64] = {
            0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
            0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
            0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
            0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
            0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
            0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
            0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
            0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2};
        uint32_t w[64];
        for (int i = 0; i < 16; i++)
            w[i] = (uint32_t)block[i*4] << 24 | (uint32_t)block[i*4+1] << 16 |
                   (uint32_t)block[i*4+2] << 8 | (uint32_t)block[i*4+3];
        for (int i = 16; i < 64; i++) {
            uint32_t s0 = rotr(w[i-15],7) ^ rotr(w[i-15],18) ^ (w[i-15] >> 3);
            uint32_t s1 = rotr(w[i-2],17) ^ rotr(w[i-2],19) ^ (w[i-2] >> 10);
            w[i] = w[i-16] + s0 + w[i-7] + s1;
        }
        uint32_t a=h[0],b=h[1],c=h[2],d=h[3],e=h[4],f=h[5],g=h[6],hh=h[7];
        for (int i = 0; i < 64; i++) {
            uint32_t S1 = rotr(e,6) ^ rotr(e,11) ^ rotr(e,25);
            uint32_t ch = (e & f) ^ (~e & g);
            uint32_t t1 = hh + S1 + ch + K[i] + w[i];
            uint32_t S0 = rotr(a,2) ^ rotr(a,13) ^ rotr(a,22);
            uint32_t mj = (a & b) ^ (a & c) ^ (b & c);
            uint32_t t2 = S0 + mj;
            hh=g; g=f; f=e; e=d+t1; d=c; c=b; b=a; a=t1+t2;
        }
        h[0]+=a; h[1]+=b; h[2]+=c; h[3]+=d; h[4]+=e; h[5]+=f; h[6]+=g; h[7]+=hh;
    }
public:
    static string hash(const string& msg) {
        uint32_t h[8] = {0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,
                         0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19};
        vector<uint8_t> data(msg.begin(), msg.end());
        uint64_t bitLen = (uint64_t)msg.size() * 8;
        data.push_back(0x80);
        while (data.size() % 64 != 56) data.push_back(0x00);
        for (int i = 7; i >= 0; i--) data.push_back((uint8_t)(bitLen >> (i * 8)));
        for (size_t off = 0; off < data.size(); off += 64) transform(h, &data[off]);
        ostringstream oss;
        for (int i = 0; i < 8; i++) oss << hex << setw(8) << setfill('0') << h[i];
        return oss.str();
    }
};

struct Transaction {
    string sender, receiver;
    double amount;
    string toString() const {
        ostringstream oss;
        oss << sender << "->" << receiver << ":" << fixed << setprecision(2) << amount;
        return oss.str();
    }
};

string merkleRoot(const vector<Transaction>& txs) {
    if (txs.empty()) return SHA256::hash("");
    vector<string> level;
    for (const auto& t : txs) level.push_back(SHA256::hash(t.toString()));
    while (level.size() > 1) {
        if (level.size() % 2 == 1) level.push_back(level.back());   // duplication si impair
        vector<string> next;
        for (size_t i = 0; i < level.size(); i += 2)
            next.push_back(SHA256::hash(level[i] + level[i+1]));
        level = next;
    }
    return level[0];
}

enum class Consensus { POW, POS };

struct Block {
    int index = 0;
    time_t timestamp = 0;
    string prevHash;
    string merkle;
    vector<Transaction> txs;
    uint64_t nonce = 0;         
    string validator;          
    string signature;
    string hash;

    string headerData() const {
        ostringstream oss;
        oss << index << timestamp << prevHash << merkle << nonce << validator;
        return oss.str();
    }
    string computeHash() const { return SHA256::hash(headerData()); }
};

struct Validator { string name; double stake; string secret; };

class Blockchain {
public:
    vector<Block> chain;
    vector<Transaction> pending;
    map<string,double> balances;
    vector<Validator> validators;
    Consensus mode;
    int difficulty;
    bool verbose;

    Blockchain(Consensus m, int diff = 4, bool v = true) : mode(m), difficulty(diff), verbose(v) {
        balances = {{"Alice",100},{"Bob",50},{"Charlie",30}};
        validators = {{"Alice",50,"kA"},{"Bob",30,"kB"},{"Charlie",20,"kC"}};
        Block g;
        g.index = 0; g.timestamp = 1700000000; g.prevHash = string(64,'0');
        g.merkle = merkleRoot({}); g.validator = "GENESIS";
        g.hash = g.computeHash();
        chain.push_back(g);
    }

    bool addTransaction(const string& from, const string& to, double amt) {
        double spent = 0;
        for (auto& t : pending) if (t.sender == from) spent += t.amount;
        if (amt <= 0 || balances[from] - spent < amt) {
            if (verbose) cout << "  [REJETEE] " << from << "->" << to << ":" << amt << " (solde insuffisant)\n";
            return false;
        }
        pending.push_back({from, to, amt});
        return true;
    }

    
    void mineBlockPoW(Block& b) {
        string target(difficulty, '0');
        b.nonce = 0;
        do { b.nonce++; b.hash = b.computeHash(); }
        while (b.hash.compare(0, difficulty, target) != 0);
    }

    Validator& selectValidator(const string& prevHash) {
        mt19937_64 rng(stoull(prevHash.substr(0, 15), nullptr, 16));
        double total = 0;
        for (auto& v : validators) total += v.stake;
        double pick = uniform_real_distribution<double>(0, total)(rng), cum = 0;
        for (auto& v : validators) { cum += v.stake; if (pick <= cum) return v; }
        return validators.back();
    }
    static string sign(const Validator& v, const string& hash) { return SHA256::hash(v.secret + hash); }

    void forgePoS(Block& b) {
        Validator& v = selectValidator(b.prevHash);
        b.validator = v.name;
        b.nonce = 0;
        b.hash = b.computeHash();
        b.signature = sign(v, b.hash);
        v.stake += 1.0;                       
    }

   
    void minePendingTransactions() {
        Block b;
        b.index = (int)chain.size();
        b.timestamp = time(nullptr);
        b.prevHash = chain.back().hash;
        b.txs = pending;
        b.merkle = merkleRoot(b.txs);
        auto t0 = Clock::now();
        if (mode == Consensus::POW) mineBlockPoW(b); else forgePoS(b);
        double ms = chrono::duration<double, milli>(Clock::now() - t0).count();
        for (auto& t : b.txs) { balances[t.sender] -= t.amount; balances[t.receiver] += t.amount; }
        chain.push_back(b);
        pending.clear();
        if (verbose) {
            cout << "  Bloc #" << b.index << " ajoute en " << fixed << setprecision(2) << ms << " ms"
                 << (mode == Consensus::POW ? " | nonce=" + to_string(b.nonce)
                                            : " | validateur=" + b.validator)
                 << " | hash=" << b.hash.substr(0, 16) << "...\n";
        }
    }

    
    int firstInvalidBlock(string* reason = nullptr) const {
        auto fail = [&](int i, const string& r) { if (reason) *reason = r; return i; };
        for (size_t i = 1; i < chain.size(); i++) {
            const Block& b = chain[i];
            const Block& p = chain[i-1];
            if (b.merkle != merkleRoot(b.txs))  return fail((int)i, "racine de Merkle incorrecte (transactions modifiees)");
            if (b.hash != b.computeHash())      return fail((int)i, "hash recalcule different du hash stocke");
            if (b.prevHash != p.hash)           return fail((int)i, "chainage rompu (prevHash != hash du bloc precedent)");
            if (mode == Consensus::POW) {
                if (b.hash.compare(0, difficulty, string(difficulty, '0')) != 0)
                    return fail((int)i, "preuve de travail invalide (difficulte non respectee)");
            } else {
                const Validator* val = nullptr;
                for (auto& v : validators) if (v.name == b.validator) val = &v;
                if (!val)                              return fail((int)i, "validateur inconnu");
                if (b.signature != sign(*val, b.hash)) return fail((int)i, "signature du validateur invalide");
            }
        }
        return -1;
    }
    bool isValid() const { return firstInvalidBlock() == -1; }

    void recomputeFrom(int start) {              
        for (size_t i = start; i < chain.size(); i++) {
            if (i > 0) chain[i].prevHash = chain[i-1].hash;
            chain[i].merkle = merkleRoot(chain[i].txs);
            chain[i].hash = chain[i].computeHash();
        }
    }
    void remineFrom(int start) {                
        for (size_t i = start; i < chain.size(); i++) {
            if (i > 0) chain[i].prevHash = chain[i-1].hash;
            chain[i].merkle = merkleRoot(chain[i].txs);
            mineBlockPoW(chain[i]);
        }
    }

    void print() const {
        for (auto& b : chain) {
            cout << "  +-- Bloc #" << b.index << (b.index == 0 ? " (genesis)" : "") << "\n"
                 << "  |  prev   : " << b.prevHash.substr(0, 20) << "...\n"
                 << "  |  merkle : " << b.merkle.substr(0, 20) << "...\n"
                 << "  |  hash   : " << b.hash.substr(0, 20) << "...\n";
            if (b.index > 0) {
                if (mode == Consensus::POW) cout << "  |  nonce  : " << b.nonce << "\n";
                else cout << "  |  valid. : " << b.validator << "\n";
                for (auto& t : b.txs) cout << "  |  tx     : " << t.toString() << "\n";
            }
        }
        cout << "  +--\n";
    }
};

void fillChain(Blockchain& bc, int nBlocks) {
    const char* names[3] = {"Alice","Bob","Charlie"};
    for (int i = 0; i < nBlocks; i++) {
        bc.addTransaction(names[i % 3], names[(i+1) % 3], 5 + i);
        bc.addTransaction(names[(i+2) % 3], names[i % 3], 2 + i);
        bc.minePendingTransactions();
    }
}
string verdict(const Blockchain& bc) {
    string r; int i = bc.firstInvalidBlock(&r);
    return i == -1 ? "VALIDE" : "INVALIDE -> bloc #" + to_string(i) + " : " + r;
}
void title(const string& s) { cout << "\n==================== " << s << " ====================\n"; }

void testBasic(Consensus m, const string& label) {
    title("TEST 1 : chaine " + label);
    Blockchain bc(m, 4);
    fillChain(bc, 4);
    bc.addTransaction("Bob", "Alice", 99999);    
    bc.print();
    cout << "  Integrite : " << verdict(bc) << "\n  Soldes    : ";
    for (auto& kv : bc.balances) cout << kv.first << "=" << kv.second << "  ";
    cout << "\n";
}

void testTamper(Consensus m, const string& label) {
    title("TEST 2 : detection de modification (" + label + ")");
    Blockchain bc(m, 3);
    fillChain(bc, 5);
    cout << "  Etat initial                          : " << verdict(bc) << "\n";

    
    bc.chain[2].txs[0].amount = 1000;
    cout << "  [A] montant modifie (bloc #2)          : " << verdict(bc) << "\n";

    
    bc.recomputeFrom(2);
    cout << "  [B] hash recalcules en cascade         : " << verdict(bc) << "\n";

    
    if (m == Consensus::POW) {
        auto t0 = Clock::now();
        bc.remineFrom(2);
        double ms = chrono::duration<double, milli>(Clock::now() - t0).count();
        cout << "  [C] re-minage des blocs #2..#5         : " << verdict(bc)
             << "  (cout : " << fixed << setprecision(2) << ms << " ms)\n";
    } else {
        cout << "  [C] en PoS impossible sans la cle secrete du validateur : attaque non reproductible\n";
    }
}

struct Result { double powMs, posMs; };
Result benchmark(int difficulty, int nBlocks) {
    Blockchain pow(Consensus::POW, difficulty, false), pos(Consensus::POS, difficulty, false);
    auto t0 = Clock::now(); fillChain(pow, nBlocks);
    double a = chrono::duration<double, milli>(Clock::now() - t0).count();
    t0 = Clock::now(); fillChain(pos, nBlocks);
    double b = chrono::duration<double, milli>(Clock::now() - t0).count();
    return {a, b};
}

int main() {
    testBasic(Consensus::POW, "Proof of Work (difficulte 4)");
    testBasic(Consensus::POS, "Proof of Stake");
    testTamper(Consensus::POW, "Proof of Work");
    testTamper(Consensus::POS, "Proof of Stake");

    title("TEST 3 : repartition des validateurs en PoS (200 blocs)");
    {
        Blockchain bc(Consensus::POS, 0, false);
        map<string,int> wins;
        for (int i = 0; i < 200; i++) {
            bc.addTransaction("Alice", "Bob", 0.01 + i * 1e-4);   
            bc.minePendingTransactions();
            wins[bc.chain.back().validator]++;
        }
        for (auto& kv : wins) cout << "  " << kv.first << " : " << kv.second << " blocs\n";
        cout << "  (mises initiales : Alice 50 / Bob 30 / Charlie 20)\n";
    }

    title("TEST 4 : comparaison PoW vs PoS (5 blocs par chaine)");
    cout << "  " << left << setw(12) << "Difficulte" << setw(16) << "PoW (ms)" << setw(16) << "PoS (ms)" << "Ratio PoW/PoS\n";
    for (int d = 1; d <= 5; d++) {
        Result r = benchmark(d, 5);
        cout << "  " << left << setw(12) << d << setw(16) << fixed << setprecision(2) << r.powMs
             << setw(16) << r.posMs << setprecision(0) << r.powMs / max(r.posMs, 0.001) << "x\n";
    }
    return 0;
}