import { useState, useEffect } from "react";
import { Upload, FileText, Loader2, TrendingUp, TrendingDown, Shield, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ClientValueNote } from "@/components/ClientValueNote";

export const CompetitiveAnalyzer = () => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [competitorName, setCompetitorName] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [products, setProducts] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);
  const [clientContext, setClientContext] = useState("");
  const [companyStrengths, setCompanyStrengths] = useState(`- Délai moyen de règlement < 10 jours sur sinistres simples
- Réseau garages agréés 300+ en Côte d'Ivoire
- Application mobile sinistre 24/7 avec géolocalisation
- Solidité financière avérée
- Notation locale excellente
- Partenariats santé exclusifs`);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) {
      console.error('Error fetching products:', error);
      return;
    }
    
    setProducts(data || []);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/msword',
        'application/vnd.ms-powerpoint'
      ];
      
      if (!allowedTypes.includes(selectedFile.type)) {
        toast({
          title: "Format non supporté",
          description: "Veuillez uploader un fichier PDF, Word ou PowerPoint",
          variant: "destructive",
        });
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      toast({
        title: "Fichier manquant",
        description: "Veuillez sélectionner un document à analyser",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress("Lecture du document...");
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const documentText = e.target?.result as string;
        
        setAnalysisProgress("Extraction des informations du document concurrent...");
        
        const { data, error } = await supabase.functions.invoke('analyze-competitor', {
          body: {
            documentText: documentText.substring(0, 50000),
            documentType: file.type,
            filename: file.name,
            competitorName: competitorName || null,
            productId: (selectedProductId && selectedProductId !== "auto") ? selectedProductId : null,
            clientContext: clientContext || null,
            companyStrengths: companyStrengths || null
          }
        });

        if (error) {
          throw error;
        }

        if (data?.success) {
          setAnalysisProgress("Finalisation de l'analyse...");
          // Merge the parameters into the analysis for ClientValueNote
          const enrichedAnalysis = {
            ...data.analysis,
            ...data.analysis.parameters
          };
          setAnalysis(enrichedAnalysis);
          toast({
            title: "Analyse terminée",
            description: "L'analyse concurrentielle a été générée avec succès",
          });
        } else {
          throw new Error(data?.error || 'Erreur lors de l\'analyse');
        }
      };
      
      reader.onerror = () => {
        throw new Error('Erreur lors de la lecture du fichier');
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible d'analyser le document",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress("");
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getImpactBadge = (impact: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      "faible": "secondary",
      "moyen": "default",
      "élevé": "destructive"
    };
    return <Badge variant={variants[impact] || "default"}>{impact}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      "faible": "secondary",
      "moyenne": "default",
      "haute": "destructive"
    };
    return <Badge variant={variants[priority] || "default"}>{priority}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Analyseur Concurrentiel IA
          </CardTitle>
          <CardDescription>
            Importez une fiche produit concurrent pour obtenir une analyse approfondie et des arguments commerciaux
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="competitor-name">Nom du concurrent (optionnel)</Label>
            <Input
              id="competitor-name"
              placeholder="Ex: Assurance Concurrent SA"
              value={competitorName}
              onChange={(e) => setCompetitorName(e.target.value)}
              disabled={isAnalyzing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-select">Produit à comparer (optionnel)</Label>
            <Select 
              value={selectedProductId} 
              onValueChange={setSelectedProductId}
              disabled={isAnalyzing}
            >
              <SelectTrigger id="product-select">
                <SelectValue placeholder="Auto-détection du produit concurrent" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="auto">Auto-détection</SelectItem>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} ({product.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-context">Contexte client (optionnel)</Label>
            <Textarea
              id="client-context"
              placeholder="Ex: PME, secteur transport, 50 véhicules, risques logistiques..."
              value={clientContext}
              onChange={(e) => setClientContext(e.target.value)}
              disabled={isAnalyzing}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-strengths">Atouts Box Africa (modifiable)</Label>
            <Textarea
              id="company-strengths"
              value={companyStrengths}
              onChange={(e) => setCompanyStrengths(e.target.value)}
              disabled={isAnalyzing}
              rows={6}
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Ces atouts seront utilisés pour personnaliser l'analyse et la note de valeur client
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-upload">Document concurrent (PDF, Word, PowerPoint)</Label>
            <div className="flex items-center gap-4">
              <Input
                id="file-upload"
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx"
                onChange={handleFileChange}
                disabled={isAnalyzing}
                className="flex-1"
              />
              {file && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  {file.name}
                </div>
              )}
            </div>
          </div>

          {isAnalyzing && analysisProgress && (
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{analysisProgress}</p>
                    <Progress value={33} className="mt-2 h-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Button
            onClick={handleAnalyze}
            disabled={!file || isAnalyzing}
            className="w-full"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Analyser le document
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {analysis && (
        <Tabs defaultValue="note-client" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="note-client">📄 Note Client</TabsTrigger>
            <TabsTrigger value="scores">Scores</TabsTrigger>
            <TabsTrigger value="swot">Forces/Faiblesses</TabsTrigger>
            <TabsTrigger value="arguments">Arguments</TabsTrigger>
            <TabsTrigger value="recommendations">Recommandations</TabsTrigger>
          </TabsList>

          <TabsContent value="note-client">
            <ClientValueNote 
              analysis={analysis} 
              competitorName={competitorName}
              clientContext={clientContext}
            />
          </TabsContent>

          <TabsContent value="scores" className="space-y-4">
            {analysis.product_not_found ? (
              <Card>
                <CardHeader>
                  <CardTitle>Produit non trouvé</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{analysis.product_not_found_message}</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {analysis.compared_product && (
                  <Card className="bg-primary/5">
                    <CardHeader>
                      <CardTitle className="text-lg">Produit comparé</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="font-medium text-lg">{analysis.compared_product.name}</p>
                        <Badge variant="outline">{analysis.compared_product.category}</Badge>
                        <p className="text-sm text-muted-foreground mt-2">{analysis.compared_product.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                <Card>
                  <CardHeader>
                    <CardTitle>Scores de Positionnement</CardTitle>
                    <CardDescription>
                      Score du concurrent comparé à notre produit. Plus le score est élevé, plus le concurrent est performant sur ce critère.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(analysis.positioning_scores || {}).map(([key, scoreData]: [string, any]) => (
                      <div key={key} className="space-y-2 p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium capitalize">{key}</span>
                          <span className={`text-2xl font-bold ${getScoreColor(scoreData.score)}`}>
                            {scoreData.score}/100
                          </span>
                        </div>
                        <Progress value={scoreData.score} className="h-2" />
                        <p className="text-sm text-muted-foreground mt-2">{scoreData.explanation}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Tableau Comparatif</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.comparison_table?.criteres?.map((critere: any, idx: number) => (
                    <div key={idx} className="grid grid-cols-4 gap-4 p-3 border rounded-lg">
                      <div className="font-medium">{critere.nom}</div>
                      <div className="text-sm text-muted-foreground">{critere.concurrent}</div>
                      <div className="text-sm text-muted-foreground">{critere.nous}</div>
                      <div className="flex justify-end">
                        {critere.avantage === "nous" && (
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        )}
                        {critere.avantage === "concurrent" && (
                          <TrendingDown className="h-5 w-5 text-red-600" />
                        )}
                        {critere.avantage === "égalité" && (
                          <span className="text-yellow-600">≈</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="swot" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Forces du Concurrent
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.strengths?.map((strength: any, idx: number) => (
                  <div key={idx} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold">{strength.titre}</h4>
                      {getImpactBadge(strength.impact)}
                    </div>
                    <p className="text-sm text-muted-foreground">{strength.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  Faiblesses du Concurrent
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.weaknesses?.map((weakness: any, idx: number) => (
                  <div key={idx} className="p-4 border rounded-lg space-y-2">
                    <h4 className="font-semibold">{weakness.titre}</h4>
                    <p className="text-sm text-muted-foreground">{weakness.description}</p>
                    <div className="pt-2 border-t">
                      <span className="text-xs font-medium text-green-600">Opportunité: </span>
                      <span className="text-sm">{weakness.opportunite}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="arguments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Arguments Commerciaux
                </CardTitle>
                <CardDescription>Phrases prêtes à utiliser lors de vos entretiens</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.commercial_arguments?.map((arg: any, idx: number) => (
                  <div key={idx} className="p-4 border-l-4 border-primary bg-muted/50 rounded-r-lg space-y-2">
                    <div className="flex items-start justify-between">
                      <p className="font-medium text-lg">{arg.argument}</p>
                      <Badge variant="outline">{arg.phrase_type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground italic">{arg.contexte}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recommandations d'Actions</CardTitle>
                <CardDescription>Actions concrètes pour vous différencier</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.recommendations?.map((rec: any, idx: number) => (
                  <div key={idx} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold">{rec.titre}</h4>
                      {getPriorityBadge(rec.priorite)}
                    </div>
                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                    <div className="pt-2 mt-2 border-t bg-primary/5 p-3 rounded">
                      <span className="text-xs font-medium">Action concrète: </span>
                      <p className="text-sm mt-1">{rec.action_concrete}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};