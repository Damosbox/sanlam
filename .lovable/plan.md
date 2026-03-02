

## Griser les onglets Communication (Messages, Actualites)

Marquer les 3 entrees du groupe "Communications" (Messages, Actualites, Campagnes) comme desactivees avec le tag "Bientot" grise, comme c'est deja le cas pour Campagnes.

### Modification unique

**Fichier** : `src/components/broker/BrokerSidebar.tsx`

Dans le tableau `navigationGroups`, section "Communications", ajouter `disabled: true` aux entrees "Messages" et "Actualites" :

```ts
{
  label: "Communications",
  items: [
    { title: "Messages", url: "/b2b/messages", icon: MessageSquare, disabled: true },
    { title: "Actualités", url: "/b2b/news", icon: Newspaper, disabled: true },
    { title: "Campagnes", url: "/b2b/campaigns", icon: Megaphone, disabled: true },
  ],
},
```

Le rendu du tag "Bientot" et le grisage sont deja geres par la fonction `renderMenuItem` existante (qui affiche un badge "Bientot" et applique `opacity-50 cursor-not-allowed` quand `disabled` est `true`). Aucun autre changement necessaire.

