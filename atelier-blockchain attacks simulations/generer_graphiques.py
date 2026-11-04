import os
import pandas as pd
import matplotlib.pyplot as plt

# Configuration du style graphique
plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')
plt.rcParams['font.sans-serif'] = 'Arial'
plt.rcParams['font.size'] = 11
plt.rcParams['axes.titlesize'] = 13
plt.rcParams['axes.titleweight'] = 'bold'
plt.rcParams['axes.labelsize'] = 11
plt.rcParams['axes.labelweight'] = 'bold'

# Création du dossier de sortie pour les graphiques
os.makedirs("graphiques", exist_ok=True)

# ==============================================================================
# 1. GRAPHIQUE : ATTAQUE 51% (balayage_51_hashrate.csv)
# ==============================================================================
if os.path.exists("balayage_51_hashrate.csv"):
    df_51 = pd.read_csv("balayage_51_hashrate.csv")
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

    # Taux de succès
    ax1.plot(df_51['hashrate_pct'], df_51['succes_vulnerable_pct'], 'o-', color='#d9534f', linewidth=2.5, markersize=7, label='Vulnérable (Sans défense)')
    ax1.plot(df_51['hashrate_pct'], df_51['succes_protege_pct'], 's--', color='#5cb85c', linewidth=2.5, markersize=7, label='Protégé (Checkpointing)')
    ax1.axvline(50, color='gray', linestyle=':', label='Seuil critique 50%')
    ax1.set_title("Attaque 51% : Taux de Succès vs Hashrate")
    ax1.set_xlabel("Hashrate de l'attaquant (%)")
    ax1.set_ylabel("Taux de succès de l'attaque (%)")
    ax1.set_ylim(-5, 105)
    ax1.legend(loc='lower right')
    ax1.grid(True, linestyle='--', alpha=0.6)

    # Pertes économiques
    ax2.plot(df_51['hashrate_pct'], df_51['pertes_vulnerable'], 'o-', color='#d9534f', linewidth=2.5, markersize=7, label='Pertes - Vulnérable')
    ax2.plot(df_51['hashrate_pct'], df_51['pertes_protege'], 's--', color='#5cb85c', linewidth=2.5, markersize=7, label='Pertes - Protégé')
    ax2.set_title("Attaque 51% : Pertes Économiques (Coins)")
    ax2.set_xlabel("Hashrate de l'attaquant (%)")
    ax2.set_ylabel("Pertes économiques directes (coins)")
    ax2.legend(loc='upper left')
    ax2.grid(True, linestyle='--', alpha=0.6)

    plt.tight_layout()
    plt.savefig("graphiques/1_attaque_51_pourcent.png", dpi=300)
    print("[OK] Graphique 1 prêt : 51% Attack")

# ==============================================================================
# 2. GRAPHIQUE : SELFISH MINING vs ALPHA (balayage_selfish_alpha.csv)
# ==============================================================================
if os.path.exists("balayage_selfish_alpha.csv"):
    df_self = pd.read_csv("balayage_selfish_alpha.csv")
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

    # Part relative des récompenses
    ax1.plot(df_self['alpha'] * 100, df_self['alpha'] * 100, 'k--', label='Minage honnête (Attendu = Alpha)')
    ax1.plot(df_self['alpha'] * 100, df_self['part_vulnerable'] * 100, 'o-', color='#d9534f', linewidth=2.5, label='Selfish Mining (Vulnérable)')
    ax1.plot(df_self['alpha'] * 100, df_self['part_protege'] * 100, 's--', color='#5cb85c', linewidth=2.5, label='Protégé (Freshness Rule)')
    ax1.set_title("Selfish Mining : Part des Récompenses vs Hashrate (α)")
    ax1.set_xlabel("Hashrate adverse α (%)")
    ax1.set_ylabel("Part des récompenses obtenues (%)")
    ax1.legend(loc='upper left')
    ax1.grid(True, linestyle='--', alpha=0.6)

    # Taux de succès
    ax2.plot(df_self['alpha'] * 100, df_self['succes_vulnerable_pct'], 'o-', color='#d9534f', linewidth=2.5, label='Succès - Vulnérable')
    ax2.plot(df_self['alpha'] * 100, df_self['succes_protege_pct'], 's--', color='#5cb85c', linewidth=2.5, label='Succès - Protégé')
    ax2.set_title("Selfish Mining : Taux de Réussite de l'Attaque")
    ax2.set_xlabel("Hashrate adverse α (%)")
    ax2.set_ylabel("Taux de réussite (%)")
    ax2.set_ylim(-5, 105)
    ax2.legend(loc='center left')
    ax2.grid(True, linestyle='--', alpha=0.6)

    plt.tight_layout()
    plt.savefig("graphiques/2_selfish_mining_alpha.png", dpi=300)
    print("[OK] Graphique 2 prêt : Selfish Mining vs Alpha")

# ==============================================================================
# 3. GRAPHIQUE : SELFISH MINING vs GAMMA (balayage_selfish_gamma.csv)
# ==============================================================================
if os.path.exists("balayage_selfish_gamma.csv"):
    df_gamma = pd.read_csv("balayage_selfish_gamma.csv")
    fig, ax = plt.subplots(figsize=(8, 5))

    ax.plot(df_gamma['gamma'], df_gamma['part_vulnerable'] * 100, 'o-', color='#d9534f', linewidth=2.5, label='Part adverse - Vulnérable')
    ax.plot(df_gamma['gamma'], df_gamma['part_protege'] * 100, 's--', color='#5cb85c', linewidth=2.5, label='Part adverse - Protégé')
    ax.axhline(35, color='gray', linestyle=':', label='Seuil théorique sans selfish (35%)')
    ax.set_title("Selfish Mining : Impact de la Propagation Réseau (γ)")
    ax.set_xlabel("Capacité de propagation réseau adverse (γ)")
    ax.set_ylabel("Part des récompenses obtenues (%)")
    ax.legend()
    ax.grid(True, linestyle='--', alpha=0.6)

    plt.tight_layout()
    plt.savefig("graphiques/3_selfish_mining_gamma.png", dpi=300)
    print("[OK] Graphique 3 prêt : Selfish Mining vs Gamma")

# ==============================================================================
# 4. GRAPHIQUE : BLOCK WITHHOLDING (balayage_bwh_puissance.csv)
# ==============================================================================
if os.path.exists("balayage_bwh_puissance.csv"):
    df_bwh = pd.read_csv("balayage_bwh_puissance.csv")
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

    # Taux de succès
    ax1.plot(df_bwh['puissance_pool_pct'], df_bwh['succes_vulnerable_pct'], 'o-', color='#d9534f', linewidth=2.5, label='Succès - Vulnérable')
    ax1.plot(df_bwh['puissance_pool_pct'], df_bwh['succes_protege_pct'], 's--', color='#5cb85c', linewidth=2.5, label='Succès - Protégé')
    ax1.set_title("Block Withholding : Taux de Réussite du Sabotage")
    ax1.set_xlabel("Puissance de l'attaquant dans la pool (%)")
    ax1.set_ylabel("Taux de réussite (%)")
    ax1.set_ylim(-5, 105)
    ax1.legend(loc='center right')
    ax1.grid(True, linestyle='--', alpha=0.6)

    # Pertes de la pool
    ax2.plot(df_bwh['puissance_pool_pct'], df_bwh['pertes_vulnerable'], 'o-', color='#d9534f', linewidth=2.5, label='Pertes Pool - Vulnérable')
    ax2.plot(df_bwh['puissance_pool_pct'], df_bwh['pertes_protege'], 's--', color='#5cb85c', linewidth=2.5, label='Pertes Pool - Protégé (Audit Rosenfeld)')
    ax2.set_title("Block Withholding : Pertes Économiques de la Pool")
    ax2.set_xlabel("Puissance de l'attaquant dans la pool (%)")
    ax2.set_ylabel("Coins perdus par la pool")
    ax2.legend(loc='upper left')
    ax2.grid(True, linestyle='--', alpha=0.6)

    plt.tight_layout()
    plt.savefig("graphiques/4_block_withholding.png", dpi=300)
    print("[OK] Graphique 4 prêt : Block Withholding")

# ==============================================================================
# 5. GRAPHIQUE : SYBIL ATTACK (balayage_sybil_sousreseaux.csv)
# ==============================================================================
if os.path.exists("balayage_sybil_sousreseaux.csv"):
    df_sybil = pd.read_csv("balayage_sybil_sousreseaux.csv")
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

    # Taux de succès
    ax1.plot(df_sybil['sous_reseaux_sybil'], df_sybil['succes_vulnerable_pct'], 'o-', color='#d9534f', linewidth=2.5, label='Succès - Vulnérable')
    ax1.plot(df_sybil['sous_reseaux_sybil'], df_sybil['succes_protege_pct'], 's--', color='#5cb85c', linewidth=2.5, label='Succès - Protégé (Diversité IP)')
    ax1.set_title("Sybil / Eclipse Attack : Taux de Réussite vs Sous-réseaux")
    ax1.set_xlabel("Nombre de sous-réseaux contrôlés par l'attaquant")
    ax1.set_ylabel("Taux de réussite (%)")
    ax1.set_ylim(-5, 105)
    ax1.legend(loc='center right')
    ax1.grid(True, linestyle='--', alpha=0.6)

    # Rappel de détection
    ax2.plot(df_sybil['sous_reseaux_sybil'], df_sybil['rappel_detection_pct'], '^-', color='#0275d8', linewidth=2.5, label='Rappel de détection (%)')
    ax2.set_title("Sybil Attack : Capacité de Détection Adaptative")
    ax2.set_xlabel("Nombre de sous-réseaux contrôlés par l'attaquant")
    ax2.set_ylabel("Rappel de détection (%)")
    ax2.set_ylim(-5, 105)
    ax2.legend(loc='upper right')
    ax2.grid(True, linestyle='--', alpha=0.6)

    plt.tight_layout()
    plt.savefig("graphiques/5_sybil_attack.png", dpi=300)
    print("[OK] Graphique 5 prêt : Sybil Attack")

print("\nAffichage interactif des graphiques en cours (fenêtres interactives)...")
plt.show()
