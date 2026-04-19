import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TECHNICIANS } from "@/data/catalog";
import { Star, ShieldCheck, Award, Clock, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/technician/$id")({
  loader: ({ params }) => {
    const tech = TECHNICIANS.find(t => t.id === params.id);
    if (!tech) throw notFound();
    return { tech };
  },
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.tech.name} — ${loaderData?.tech.specialization} | Gayatri` }] }),
  component: TechPage,
  notFoundComponent: () => <Layout><div className="container mx-auto px-4 py-20 text-center"><h1 className="text-2xl font-bold">Technician not found</h1></div></Layout>,
});

function TechPage() {
  const { tech } = Route.useLoaderData();
  const total = tech.ratingBreakdown.reduce((s: number, n: number) => s + n, 0);
  return (
    <Layout>
      <div className="container mx-auto px-4 py-4">
        <nav className="text-xs text-muted-foreground flex items-center gap-1">
          <Link to="/" className="hover:text-primary">Home</Link><ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Technician · {tech.id}</span>
        </nav>
      </div>

      <div className="container mx-auto px-4 py-6 grid lg:grid-cols-[320px_1fr] gap-6">
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <img src={tech.photo} alt={tech.name} className="w-full aspect-[4/5] object-cover" />
            <div className="p-5">
              <h1 className="text-xl font-bold">{tech.name}</h1>
              <div className="text-xs text-muted-foreground">ID: {tech.id}</div>
              <Badge className="mt-2 bg-success/15 text-success border border-success/30 hover:bg-success/15"><ShieldCheck className="h-3 w-3 mr-1" />Verified · Background Checked</Badge>
              <div className="mt-3 flex items-center gap-1">
                <Star className="h-5 w-5 fill-primary text-primary" />
                <span className="text-xl font-bold">{tech.rating}</span>
                <span className="text-xs text-muted-foreground">({tech.jobs} jobs)</span>
              </div>
            </div>
          </Card>
          <Link to="/booking"><Button className="w-full bg-gradient-gold text-primary-foreground">Book this technician</Button></Link>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-4 text-center"><Award className="h-6 w-6 text-primary mx-auto mb-1" /><div className="text-2xl font-bold">{tech.experience}+</div><div className="text-xs text-muted-foreground">Years exp.</div></Card>
            <Card className="p-4 text-center"><Clock className="h-6 w-6 text-primary mx-auto mb-1" /><div className="text-2xl font-bold">{tech.onTime}%</div><div className="text-xs text-muted-foreground">On-time arrival</div></Card>
            <Card className="p-4 text-center"><ShieldCheck className="h-6 w-6 text-primary mx-auto mb-1" /><div className="text-2xl font-bold">{tech.jobs}</div><div className="text-xs text-muted-foreground">Jobs done</div></Card>
          </div>

          <Card className="p-5">
            <h3 className="font-semibold mb-2">Specializations</h3>
            <p className="text-sm text-muted-foreground">{tech.specialization}</p>
            <h3 className="font-semibold mt-4 mb-2">Certifications</h3>
            <div className="flex gap-2 flex-wrap">{tech.certifications.map((c:string)=> <Badge key={c} variant="outline">{c}</Badge>)}</div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold mb-3">Rating breakdown</h3>
            {[5,4,3,2,1].map((star, i) => {
              const n = tech.ratingBreakdown[i];
              const pct = total ? (n/total)*100 : 0;
              return (
                <div key={star} className="flex items-center gap-3 text-sm mb-1.5">
                  <span className="w-8 flex items-center gap-0.5">{star}<Star className="h-3 w-3 fill-primary text-primary" /></span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-gold" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-12 text-right">{n}</span>
                </div>
              );
            })}
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold mb-3">Customer reviews</h3>
            <div className="space-y-4">
              {tech.reviews.map((r: any, i: number) => (
                <div key={i} className="border-b last:border-0 pb-3 last:pb-0">
                  <div className="flex items-center justify-between"><span className="font-medium text-sm">{r.name}</span>
                    <div className="flex">{Array.from({length:r.rating}).map((_,j)=><Star key={j} className="h-3.5 w-3.5 fill-primary text-primary" />)}</div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{r.text}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
