import { useState } from "react";
import { Header } from "@/components/Header";
import { SavingsSlider } from "@/components/savings/SavingsSlider";
import { ResultCard } from "@/components/savings/ResultCard";
import { SavingsDonutChart } from "@/components/savings/SavingsDonutChart";
import { DynamicExplanation } from "@/components/savings/DynamicExplanation";
import { calculateSavings, formatCurrency, getLifestyleLabel } from "@/utils/savingsCalculator";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SavingsSimulator = () => {
  const navigate = useNavigate();
  const [monthlyPremium, setMonthlyPremium] = useState(20000);
  const [years, setYears] = useState(10);
  const [lastChangedParam, setLastChangedParam] = useState<"premium" | "years">("premium");

  const results = calculateSavings(monthlyPremium, years);

  const handlePremiumChange = (value: number) => {
    setMonthlyPremium(value);
    setLastChangedParam("premium");
  };

  const handleYearsChange = (value: number) => {
    setYears(value);
    setLastChangedParam("years");
  };

  const estimatedYearlyIncrease = Math.round(results.totalInterests / years);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Header */}
      <section className="bg-gradient-to-br from-primary/5 to-accent/5 py-16 px-4">
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
            Simulation Épargne Plus
          </h1>
          <p className="text-lg text-muted-foreground animate-fade-in">
            Estimation rapide et claire, sans inscription.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Left Column - Controls */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-6">Personnalisez votre épargne</h2>
            
            <SavingsSlider
              min={10000}
              max={49000}
              value={monthlyPremium}
              onChange={handlePremiumChange}
              label="Montant de la prime mensuelle"
              subtitle={getLifestyleLabel(monthlyPremium)}
              helperText="Adaptez le montant selon vos moyens. Rien n'est définitif."
            />

            <SavingsSlider
              min={5}
              max={25}
              value={years}
              onChange={handleYearsChange}
              label="Durée du contrat"
              subtitle={`+1 an = +${formatCurrency(estimatedYearlyIncrease)} d'intérêts estimés`}
              helperText="Plus la durée est longue, plus votre argent travaille pour vous."
              unit="ans"
            />

            <DynamicExplanation
              monthlyPremium={monthlyPremium}
              years={years}
              lastChangedParam={lastChangedParam}
            />
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-6">Vos résultats estimés</h2>
            
            <ResultCard
              label="Capital estimé au terme"
              value={results.finalCapital}
              description="Montant que vous recevez au terme du contrat."
              color="blue"
            />

            <ResultCard
              label="Intérêts cumulés"
              value={results.totalInterests}
              description="Ce que votre épargne gagne dans le temps."
              color="green"
            />

            <ResultCard
              label="Primes totales versées"
              value={results.totalPremiums}
              description="Votre effort d'épargne cumulé."
              color="orange"
            />
          </div>
        </div>

        {/* Donut Chart */}
        <div className="bg-gradient-to-br from-muted/30 to-muted/10 rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Répartition de votre épargne
          </h2>
          <SavingsDonutChart
            totalPremiums={results.netInvested}
            totalInterests={results.totalInterests}
            totalFees={results.totalFees}
          />
        </div>

        {/* Pedagogical Section */}
        <section className="bg-muted/30 rounded-2xl p-8 space-y-6">
          <h3 className="text-2xl font-bold">Comment fonctionne Épargne Plus ?</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold flex-shrink-0">
                1
              </div>
              <p className="text-foreground leading-relaxed">
                Vous versez une prime chaque mois selon vos capacités.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold flex-shrink-0">
                2
              </div>
              <p className="text-foreground leading-relaxed">
                Une partie est investie et capitalise des intérêts chaque année.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold flex-shrink-0">
                3
              </div>
              <p className="text-foreground leading-relaxed">
                Après 2 ans, vous pouvez retirer selon des règles simples et flexibles.
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-background/50 rounded-xl border border-border/50">
            <p className="text-sm text-muted-foreground leading-relaxed">
              💼 <strong>Important :</strong> Ceci est une estimation. Les montants réels peuvent varier selon les conditions du marché. 
              Votre argent reste disponible après 2 ans avec des conditions de rachat flexibles.
            </p>
          </div>
        </section>

        {/* CTA Section */}
        <div className="mt-12 text-center space-y-4">
          <h3 className="text-2xl font-bold">Prêt à démarrer votre épargne ?</h3>
          <p className="text-muted-foreground mb-6">
            Prenez le temps d'explorer vos options. Notre équipe est là pour vous accompagner.
          </p>
          <Button
            size="lg"
            className="px-8"
            onClick={() => navigate("/b2c", { state: { productType: "savings" } })}
          >
            Souscrire à Épargne Plus
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SavingsSimulator;
