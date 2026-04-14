import { useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Image from "@tiptap/extension-image";
import { Table as TiptapTable } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Placeholder from "@tiptap/extension-placeholder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentVariableInserter } from "./DocumentVariableInserter";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, List, ListOrdered,
  Table as TableIcon, Image as ImageIcon, Code, Eye, Undo, Redo,
} from "lucide-react";

const CATEGORIES = [
  { value: "contrat", label: "Contrat" },
  { value: "attestation", label: "Attestation" },
  { value: "avenant", label: "Avenant" },
  { value: "autre", label: "Autre" },
];

interface DocumentTemplateEditorProps {
  initialData?: {
    id?: string;
    name: string;
    description: string;
    category: string;
    type: string;
    content: string;
    is_active: boolean;
  };
  onSave: (data: {
    name: string;
    description: string;
    category: string;
    type: string;
    content: string;
    is_active: boolean;
  }) => void;
  onCancel: () => void;
  saving?: boolean;
}

export function DocumentTemplateEditor({ initialData, onSave, onCancel, saving }: DocumentTemplateEditorProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [category, setCategory] = useState(initialData?.category || "autre");
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
  const [viewMode, setViewMode] = useState<"editor" | "source" | "preview">("editor");
  const [sourceHtml, setSourceHtml] = useState(initialData?.content || "");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Image,
      Placeholder.configure({ placeholder: "Commencez à rédiger votre template…" }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TiptapTable.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: initialData?.content || "",
    onUpdate: ({ editor }) => {
      setSourceHtml(editor.getHTML());
    },
  });

  const insertVariable = useCallback((variable: string) => {
    editor?.chain().focus().insertContent(variable).run();
  }, [editor]);

  const handleSourceChange = (html: string) => {
    setSourceHtml(html);
    editor?.commands.setContent(html);
  };

  const handleSave = () => {
    onSave({
      name,
      description,
      category,
      type: category,
      content: sourceHtml,
      is_active: isActive,
    });
  };

  if (!editor) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label>Nom du template</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Contrat Auto Standard" />
        </div>
        <div className="space-y-1.5">
          <Label>Catégorie</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description courte…" />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border rounded-lg p-2 bg-muted/30">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => editor.chain().focus().toggleBold().run()} data-active={editor.isActive("bold")}><Bold className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="h-4 w-4" /></Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeft className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenter className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => editor.chain().focus().setTextAlign("right").run()}><AlignRight className="h-4 w-4" /></Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><TableIcon className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
          const url = window.prompt("URL de l'image");
          if (url) editor.chain().focus().setImage({ src: url }).run();
        }}><ImageIcon className="h-4 w-4" /></Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => editor.chain().focus().undo().run()}><Undo className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => editor.chain().focus().redo().run()}><Redo className="h-4 w-4" /></Button>
        <div className="flex-1" />
        <DocumentVariableInserter onInsert={insertVariable} />
      </div>

      {/* Content area */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
        <TabsList>
          <TabsTrigger value="editor">Éditeur</TabsTrigger>
          <TabsTrigger value="source"><Code className="h-3 w-3 mr-1" />Source HTML</TabsTrigger>
          <TabsTrigger value="preview"><Eye className="h-3 w-3 mr-1" />Prévisualisation</TabsTrigger>
        </TabsList>
        <TabsContent value="editor">
          <div className="border rounded-lg p-4 min-h-[400px] prose prose-sm max-w-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[360px]">
            <EditorContent editor={editor} />
          </div>
        </TabsContent>
        <TabsContent value="source">
          <Textarea
            value={sourceHtml}
            onChange={(e) => handleSourceChange(e.target.value)}
            className="min-h-[400px] font-mono text-xs"
          />
        </TabsContent>
        <TabsContent value="preview">
          <div
            className="border rounded-lg p-6 min-h-[400px] prose prose-sm max-w-none bg-white"
            dangerouslySetInnerHTML={{ __html: sourceHtml }}
          />
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex items-center justify-between border-t pt-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded" />
          Template actif
        </label>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>Annuler</Button>
          <Button onClick={handleSave} disabled={!name.trim() || saving}>
            {saving ? "Enregistrement…" : initialData?.id ? "Mettre à jour" : "Créer"}
          </Button>
        </div>
      </div>
    </div>
  );
}
