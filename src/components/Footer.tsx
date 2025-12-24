import { Link } from "react-router-dom";
import { Facebook, Twitter, Linkedin, Instagram, Youtube, Phone, Mail, MapPin } from "lucide-react";
import sanlamLogo from "@/assets/logo_sanlam.svg";

const footerLinks = {
  assurance: [
    { name: "Assurance Auto", href: "/b2c" },
    { name: "Assurance Habitation", href: "/b2c" },
    { name: "Assurance Santé", href: "/b2c" },
    { name: "Assurance Vie", href: "/b2c" },
  ],
  epargne: [
    { name: "Épargne Plus", href: "/simulateur-epargne" },
    { name: "Educ'Plus", href: "/simulateur-education" },
    { name: "Plan Retraite", href: "/simulateur-epargne" },
  ],
  entreprise: [
    { name: "À propos", href: "#" },
    { name: "Carrières", href: "#" },
    { name: "Actualités", href: "#" },
    { name: "Partenaires", href: "/courtiers" },
  ],
  legal: [
    { name: "Mentions légales", href: "#" },
    { name: "Politique de confidentialité", href: "#" },
    { name: "Conditions générales", href: "#" },
    { name: "Gestion des cookies", href: "#" },
  ],
};

const socialLinks = [
  { name: "Facebook", icon: Facebook, href: "https://facebook.com/sanlamallianz" },
  { name: "Twitter", icon: Twitter, href: "https://twitter.com/sanlamallianz" },
  { name: "LinkedIn", icon: Linkedin, href: "https://linkedin.com/company/sanlamallianz" },
  { name: "Instagram", icon: Instagram, href: "https://instagram.com/sanlamallianz" },
  { name: "YouTube", icon: Youtube, href: "https://youtube.com/sanlamallianz" },
];

export const Footer = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      {/* Main Footer */}
      <div className="container py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Logo & Contact */}
          <div className="col-span-2 lg:col-span-2">
            <Link to="/" className="inline-block mb-6">
              <img src={sanlamLogo} alt="Sanlam Allianz" className="h-10 brightness-0 invert" />
            </Link>
            
            <div className="space-y-3 text-sm text-white/80">
              <a href="tel:+22527202597000" className="flex items-center gap-2 hover:text-white transition-colors">
                <Phone className="w-4 h-4" />
                (+225) 27 20 25 97 00
              </a>
              <a href="mailto:contact@sanlamallianz.ci" className="flex items-center gap-2 hover:text-white transition-colors">
                <Mail className="w-4 h-4" />
                contact@sanlamallianz.ci
              </a>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  Immeuble Sanlam Allianz<br />
                  Boulevard Roume, Le Plateau<br />
                  Abidjan, Côte d'Ivoire
                </span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-3 mt-6">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  aria-label={social.name}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Assurance Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Assurance</h3>
            <ul className="space-y-2">
              {footerLinks.assurance.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Épargne Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Épargne & Retraite</h3>
            <ul className="space-y-2">
              {footerLinks.epargne.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Entreprise Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">L'entreprise</h3>
            <ul className="space-y-2">
              {footerLinks.entreprise.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Informations légales</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/60">
            <p>© {new Date().getFullYear()} Sanlam Allianz. Tous droits réservés.</p>
            <p>
              Société d'assurance agréée par la CIMA sous le n° SA-001
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
