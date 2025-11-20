import { useState } from "react";
import { Header } from "@/components/Header";
import { EducationSlider } from "@/components/education/EducationSlider";
import { EducationResultCard } from "@/components/education/EducationResultCard";
import { EducationChart } from "@/components/education/EducationChart";
import { EducationExplanation } from "@/components/education/EducationExplanation";
import { calculateEducation, formatCurrency, getChildAgeLabel } from "@/utils/educationCalculator";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const EducationSimulator = () => {
  const navigate = useNavigate();
  const [monthlyPremium, setMonthlyPremium] = useState(25000);
  const [deferredYears, setDeferredYears] = useState(10);
  const [childAge, setChildAge] = useState(5);
  const [lastChangedParam, setLastChangedParam] = useState<"premium" | "years">("premium");

  const results = calculateEducation(monthlyPremium, deferredYears);

  const handlePremiumChange = (value: number) => {
    setMonthlyPremium(value);
    setLastChangedParam("premium");
  };

  const handleYearsChange = (value: number) => {
    setDeferredYears(value);
    setLastChangedParam("years");
  };

  const handleChildAgeChange = (value: number) => {
    setChildAge(value);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Header */}
      <section className="bg-gradient-to-br from-purple-500/5 to-indigo-500/5 py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-6 hover:bg-background/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-fade-in">
            Simulation Educ'Plus
          </h1>
          <p className="text-lg text-muted-foreground animate-fade-in">
            Planifiez le financement des études de vos enfants avec une rente certaine sur 5 ans.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Left Column - Controls */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-6">Personnalisez votre plan éducation</h2>
            
            <EducationSlider
              min={10000}
              max={50000}
              value={monthlyPremium}
              onChange={handlePremiumChange}
              label="Montant de la prime mensuelle"
              subtitle={`≈ ${formatCurrency(monthlyPremium * 12)} par an`}
              helperText="Définissez votre capacité d'épargne mensuelle pour l'éducation."
            />

            <EducationSlider
              min={5}
              max={20}
              value={deferredYears}
              onChange={handleYearsChange}
              label="Période de différé (accumulation)"
              subtitle={getChildAgeLabel(childAge, deferredYears)}
              helperText="Durée avant le versement de la rente éducation."
              unit="ans"
            />

            <EducationSlider
              min={0}
              max={15}
              value={childAge}
              onChange={handleChildAgeChange}
              label="Âge actuel de l'enfant"
              subtitle={`Rente disponible à ${childAge + deferredYears} ans`}
              helperText="Permet de contextualiser le moment du besoin éducatif."
              unit="ans"
            />

            <EducationExplanation
              monthlyPremium={monthlyPremium}
              deferredYears={deferredYears}
              lastChangedParam={lastChangedParam}
            />
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-6">Vos résultats estimés</h2>
            
            <EducationResultCard
              label="Rente annuelle (5 ans)"
              value={results.annualRent}
              description="Montant versé chaque année pendant 5 ans pour financer les études."
              color="purple"
            />

            <EducationResultCard
              label="Total reçu sur 5 ans"
              value={results.totalRentReceived}
              description="Somme totale disponible pour l'éducation de vos enfants."
              color="green"
            />

            <EducationResultCard
              label="Primes totales versées"
              value={results.totalPremiumsPaid}
              description="Votre investissement total pendant la période d'accumulation."
              color="blue"
            />
          </div>
        </div>

        {/* Chart */}
        <div className="bg-gradient-to-br from-muted/30 to-muted/10 rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Vue d'ensemble du plan éducation
          </h2>
          <EducationChart
            totalPremiumsPaid={results.totalPremiumsPaid}
            totalRentReceived={results.totalRentReceived}
            totalFees={results.totalFees}
          />
        </div>

        {/* Pedagogical Section */}
        <section className="bg-muted/30 rounded-2xl p-8 space-y-6">
          <h3 className="text-2xl font-bold">Comment fonctionne Educ'Plus ?</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                1
              </div>
              <p className="text-foreground leading-relaxed">
                <strong>Phase d'accumulation :</strong> Vous versez une prime mensuelle pendant la période de différé choisie.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                2
              </div>
              <p className="text-foreground leading-relaxed">
                <strong>Capitalisation :</strong> Votre capital est investi et génère des intérêts progressifs.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                3
              </div>
              <p className="text-foreground leading-relaxed">
                <strong>Rente éducation :</strong> À l'échéance, vous recevez une rente annuelle certaine pendant 5 ans pour financer les études.
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
            <p className="text-sm text-foreground leading-relaxed">
              <strong>🛡️ Garanties incluses :</strong> En cas de décès ou d'invalidité totale et permanente de l'assuré avant l'échéance, 
              les bénéficiaires désignés reçoivent la rente certaine jusqu'au terme du contrat.
            </p>
          </div>

          <div className="mt-4 p-4 bg-background/50 rounded-xl border border-border/50">
            <p className="text-sm text-muted-foreground leading-relaxed">
              💼 <strong>Important :</strong> Ceci est une estimation. La rente annuelle minimum admissible est de 100 000 FCFA. 
              Mode de paiement : Prélèvement Bancaire.
            </p>
          </div>
        </section>

        {/* CTA Section */}
        <div className="mt-12 text-center space-y-4">
          <h3 className="text-2xl font-bold">Prêt à sécuriser l'avenir de vos enfants ?</h3>
          <p className="text-muted-foreground mb-6">
            Offrez à vos enfants les meilleures chances de réussite avec Educ'Plus.
          </p>
          <Button
            size="lg"
            className="px-8"
            onClick={() => navigate("/b2c", { state: { productType: "education" } })}
          >
            Souscrire à Educ'Plus
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EducationSimulator;
