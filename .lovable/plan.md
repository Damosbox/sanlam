

# Refonte page d'accueil Espace Intermediaire (sans temoignages)

La section "Preuve sociale / Temoignages" est exclue de cette implementation. Elle sera ajoutee ulterieurement avec de vrais retours d'utilisateurs.

---

## 1. Header -- Bouton unique

**Fichier** : `src/components/Header.tsx`

- Supprimer le bouton ghost "Se connecter" dans la top-bar ET le bouton "Acceder a mon espace" dans la nav principale
- Les remplacer par un seul bouton **"Se connecter a mon espace"** dans la nav principale, pointant vers `/auth/partner`

---

## 2. Hero -- Carrousel 5 slides + 4 badges

**Nouveau fichier** : `src/components/broker-landing/HeroCarousel.tsx`

Carrousel Embla (deja installe) avec autoplay toutes les 6 secondes et dots de pagination :

| Slide | Titre | Accroche |
|-------|-------|----------|
| 1 | Bienvenue sur votre espace | Une plateforme unique pour connecter, accompagner et renforcer durablement notre reseau d'intermediaires. |
| 2 | Un seul espace. Tous vos outils. | Pilotez vos activites, accedez aux services et suivez vos performances dans un environnement simple et centralise. |
| 3 | Une experience simple, humaine et efficace. | Des parcours clairs, une assistance disponible et un accompagnement pense pour chaque etape de votre activite. |
| 4 | Des outils concus pour votre performance. | Gagnez en efficacite, en visibilite et en reactivite grace a des outils adaptes a votre quotidien. |
| 5 | Un ecosysteme qui anticipe vos besoins. | Une plateforme concue pour evoluer avec vos besoins et enrichir progressivement votre experience. |

Chaque slide : fond gradient, bouton CTA "Se connecter a mon espace", image dashboard a droite.

**4 badges permanents** en bas du hero (overlay) :
- Plateforme securisee (Shield)
- Accompagnement dedie (Users)
- Accessible web et mobile (Smartphone)
- En constante evolution (Rocket)

---

## 3. Section "Promesse globale" (nouvelle)

**Fichier** : `src/pages/Commercial.tsx`

Apres le hero, une section de transition :
- Titre : "Un espace unique pour simplifier votre quotidien"
- Texte : "Cette plateforme a ete concue pour vous faire gagner du temps, structurer votre activite et faciliter vos interactions avec SanlamAllianz, dans un environnement simple, securise et evolutif."

---

## 4. Section "Fonctionnalites cles" -- 4 nouvelles cartes

**Fichier** : `src/pages/Commercial.tsx` (remplacement des cartes existantes)

Titre : "Tous les outils essentiels, reunis en un seul espace"

| Carte | Titre | Description |
|-------|-------|-------------|
| 1 | Prospecter efficacement | Identifiez, suivez et priorisez vos opportunites commerciales depuis un seul espace. |
| 2 | Vendre simplement | Accedez a des parcours de vente guides et generez vos devis en quelques etapes. |
| 3 | Agir au bon moment | Recevez des recommandations intelligentes basees sur votre activite et vos priorites. |
| 4 | Rester conforme sans effort | Centralisez vos documents et automatisez les controles reglementaires en toute securite. |

---

## 5. Section "Pilotage et performance" (revision)

**Fichier** : `src/pages/Commercial.tsx` (remplacement de la section dashboard preview)

- Titre : "Enfin une vision claire de votre activite"
- Liste : Vue globale, Alertes automatiques, Suivi simplifie, Reporting accessible
- Image dashboard conservee a droite

---

## 6. Section "Valeur SanlamAllianz" -- 4 piliers

**Fichier** : `src/pages/Commercial.tsx` (remplacement de la section benefits)

Titre : "Plus qu'une plateforme, un partenariat durable"

4 cartes :
- Accompagnement et proximite
- Outils digitaux performants
- Formation et montee en competences
- Communaute d'intermediaires

---

## 7. Section "Innovation et projection" (nouvelle)

**Fichier** : `src/pages/Commercial.tsx`

- Titre : "Un ecosysteme moderne, evolutif et intelligent"
- Texte sur l'evolution continue de la plateforme

---

## 8. CTA final unifie

**Fichier** : `src/pages/Commercial.tsx`

- Texte : "Connectez-vous pour acceder a l'ensemble des services et outils mis a votre disposition."
- Un seul bouton : "Se connecter a mon espace"
- Suppression du bouton "Nous contacter"

---

## 9. Suppressions

- Section temoignages : supprimee entierement
- Barre de stats en dur dans le hero (500+, +35%, 2.5x, 24/7) : supprimee
- Badge flottant "+35% Productivite" : supprime

---

## Resume des fichiers

| Fichier | Action |
|---------|--------|
| `src/components/Header.tsx` | Modifier : un seul bouton CTA |
| `src/components/broker-landing/HeroCarousel.tsx` | Creer : carrousel 5 slides + badges |
| `src/pages/Commercial.tsx` | Recrire : nouvelles sections, suppression temoignages |

## Details techniques

- Carrousel : composant `Carousel` de `src/components/ui/carousel.tsx` (Embla, deja installe)
- Autoplay : plugin `embla-carousel-autoplay` (a ajouter si absent, sinon setInterval)
- Badges : positionnement absolu en bas du hero, grille 2x2 sur mobile, 4 colonnes sur desktop
- Icones Lucide : Shield, Users, Smartphone, Rocket, Target, Zap, Bell, FileCheck, Eye, BarChart3, Award, Lightbulb
- Design system existant conserve (couleurs Sanlam, Tailwind, shadcn)

