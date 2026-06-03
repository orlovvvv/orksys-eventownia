import { Link } from "@tanstack/react-router";

export default function SiteFooter() {
  return (
    <footer className="mt-auto bg-surface-container-low py-12">
      <div className="mx-auto grid w-full max-w-page gap-8 px-4 md:grid-cols-4 md:px-6">
        <div className="flex flex-col gap-3">
          <div className="text-sm font-bold text-foreground">Eventownia</div>
          <p className="max-w-xs text-sm/relaxed text-muted-foreground">
            Wynajem atrakcji eventowych z potwierdzeniem dostępności przez obsługę.
          </p>
          <p className="text-sm text-muted-foreground">© 2026 Eventownia. Wszystkie prawa zastrzeżone.</p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="text-sm font-bold text-foreground">Oferta</div>
          <Link to="/produkty" className="text-sm text-muted-foreground">
            Katalog
          </Link>
          <Link to="/wynajem" search={{}} className="text-sm text-muted-foreground">
            Zapytanie
          </Link>
          <Link to="/faq" className="text-sm text-muted-foreground">
            FAQ
          </Link>
        </div>
        <div className="flex flex-col gap-3">
          <div className="text-sm font-bold text-foreground">Legal</div>
          <Link to="/regulamin" className="text-sm text-muted-foreground">
            Regulamin
          </Link>
          <Link to="/polityka-prywatnosci" className="text-sm text-muted-foreground">
            Prywatność
          </Link>
          <Link to="/cookies" className="text-sm text-muted-foreground">
            Cookies
          </Link>
        </div>
        <div className="flex flex-col gap-3">
          <div className="text-sm font-bold text-foreground">Kontakt</div>
          <Link to="/kontakt" className="text-sm text-muted-foreground">
            Formularz kontaktowy
          </Link>
          <span className="text-sm text-muted-foreground">Instagram</span>
          <span className="text-sm text-muted-foreground">LinkedIn</span>
        </div>
      </div>
    </footer>
  );
}
