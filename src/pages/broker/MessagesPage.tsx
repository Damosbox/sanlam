import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function MessagesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Centre de Communication</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-center text-muted-foreground py-8">
          Messagerie - En cours de développement
        </p>
      </CardContent>
    </Card>
  );
}
