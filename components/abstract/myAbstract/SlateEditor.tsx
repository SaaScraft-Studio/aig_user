"use client";

import React, { useMemo, useCallback } from "react";
import {
  createEditor,
  Descendant,
  Editor,
  Transforms,
  Element as SlateElement,
  Node as SlateNode,
  BaseEditor,
} from "slate";
import {
  Slate,
  Editable,
  withReact,
  useSlate,
  ReactEditor,
  RenderLeafProps,
  RenderElementProps,
} from "slate-react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Quote,
  Underline,
} from "lucide-react";
import { cn } from "@/lib/utils";

// === Type Declarations ===
type CustomText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
};

type CustomElement = {
  type:
    | "paragraph"
    | "heading-one"
    | "heading-two"
    | "block-quote"
    | "numbered-list"
    | "bulleted-list"
    | "list-item"
    | "left"
    | "center"
    | "right"
    | "justify";
  children: CustomText[];
};

declare module "slate" {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

// === Props ===
type SlateEditorProps = {
  value: Descendant[];
  onChange: (value: Descendant[]) => void;
};

const MAX_CHAR = 3000;

const SlateEditor = ({ value, onChange }: SlateEditorProps) => {
  const editor = useMemo(() => withReact(createEditor()), []);
  const renderLeaf = useCallback(
    (props: RenderLeafProps) => <Leaf {...props} />,
    []
  );
  const renderElement = useCallback(
    (props: RenderElementProps) => <Element {...props} />,
    []
  );

  // let characterCount = 0;
  // try {
  //   characterCount = value.reduce(
  //     (count, node) => count + SlateNode.string(node).length,
  //     0
  //   );
  // } catch {
  //   characterCount = 0;
  // }
  // const isOverLimit = characterCount > MAX_CHAR;

  return (
    <div className="space-y-2 border rounded-md bg-white p-3 min-h-[140px]">
      <Slate editor={editor} initialValue={value} onChange={onChange}>
        <Toolbar />
        <Editable
          className="mt-2 outline-none"
          renderLeaf={renderLeaf}
          renderElement={renderElement}
          placeholder="Enter abstract..."
        />
        {/* <div className="text-right text-xs text-muted-foreground mt-1">
          <span className={cn(isOverLimit && "text-red-500")}>
            {characterCount} / {MAX_CHAR} characters
          </span>
        </div> */}
      </Slate>
    </div>
  );
};

export default SlateEditor;

// === Toolbar ===
const Toolbar = () => {
  return (
    <div className="flex flex-wrap gap-2 border-b pb-1 mb-1">
      <MarkButton format="bold" icon={<Bold size={16} />} />
      <MarkButton format="italic" icon={<Italic size={16} />} />
      <MarkButton format="underline" icon={<Underline size={16} />} />
      <BlockButton format="heading-one" icon={<Heading1 size={16} />} />
      <BlockButton format="heading-two" icon={<Heading2 size={16} />} />
      <BlockButton format="block-quote" icon={<Quote size={16} />} />
      <BlockButton format="numbered-list" icon={<ListOrdered size={16} />} />
      <BlockButton format="bulleted-list" icon={<List size={16} />} />
      <BlockButton format="left" icon={<AlignLeft size={16} />} />
      <BlockButton format="center" icon={<AlignCenter size={16} />} />
      <BlockButton format="right" icon={<AlignRight size={16} />} />
      <BlockButton format="justify" icon={<AlignJustify size={16} />} />
    </div>
  );
};

// === Mark Button ===
const MarkButton = ({
  format,
  icon,
}: {
  format: keyof CustomText;
  icon: React.ReactNode;
}) => {
  const editor = useSlate();
  const isActive = isMarkActive(editor, format);

  return (
    <button
      type="button"
      className={cn(
        "p-1 rounded-md hover:bg-gray-200 text-sm",
        isActive && "bg-gray-300"
      )}
      onMouseDown={(e) => {
        e.preventDefault();
        toggleMark(editor, format);
      }}
      aria-pressed={isActive}
      aria-label={format}
    >
      {icon}
    </button>
  );
};

const isMarkActive = (editor: Editor, format: keyof CustomText) => {
  const marks = Editor.marks(editor) as CustomText | null;
  return marks?.[format] === true;
};

const toggleMark = (editor: Editor, format: keyof CustomText) => {
  const isActive = isMarkActive(editor, format);
  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

// === Block Button ===
const BlockButton = ({
  format,
  icon,
}: {
  format: CustomElement["type"];
  icon: React.ReactNode;
}) => {
  const editor = useSlate();
  const isActive = isBlockActive(editor, format);

  return (
    <button
      type="button"
      className={cn(
        "p-1 rounded-md hover:bg-gray-200 text-sm",
        isActive && "bg-gray-300"
      )}
      onMouseDown={(e) => {
        e.preventDefault();
        toggleBlock(editor, format);
      }}
      aria-pressed={isActive}
      aria-label={format}
    >
      {icon}
    </button>
  );
};

const isBlockActive = (editor: Editor, format: string) => {
  const [match] = Array.from(
    Editor.nodes(editor, {
      match: (n) =>
        !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === format,
    })
  );
  return !!match;
};

const toggleBlock = (editor: Editor, format: CustomElement["type"]) => {
  const isActive = isBlockActive(editor, format);
  const isList = format === "numbered-list" || format === "bulleted-list";

  Transforms.unwrapNodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      (n.type === "numbered-list" || n.type === "bulleted-list"),
    split: true,
  });

  let newType: CustomElement["type"] = isActive ? "paragraph" : format;

  if (!isActive && isList) {
    Transforms.wrapNodes(
      editor,
      {
        type: format,
        children: [],
      },
      { split: true }
    );
    newType = "list-item";
  }

  Transforms.setNodes(editor, { type: newType });
};

// === Element Renderer ===
const Element = ({ attributes, children, element }: RenderElementProps) => {
  switch (element.type) {
    case "heading-one":
      return <h1 {...attributes}>{children}</h1>;
    case "heading-two":
      return <h2 {...attributes}>{children}</h2>;
    case "block-quote":
      return (
        <blockquote className="pl-4 border-l-4 italic" {...attributes}>
          {children}
        </blockquote>
      );
    case "numbered-list":
      return (
        <ol className="list-decimal pl-6" {...attributes}>
          {children}
        </ol>
      );
    case "bulleted-list":
      return (
        <ul className="list-disc pl-6" {...attributes}>
          {children}
        </ul>
      );
    case "list-item":
      return <li {...attributes}>{children}</li>;
    case "left":
    case "center":
    case "right":
    case "justify":
      return (
        <div style={{ textAlign: element.type }} {...attributes}>
          {children}
        </div>
      );
    default:
      return <p {...attributes}>{children}</p>;
  }
};

// === Leaf Renderer ===
const Leaf = ({ attributes, children, leaf }: RenderLeafProps) => {
  if (leaf.bold) children = <strong>{children}</strong>;
  if (leaf.italic) children = <em>{children}</em>;
  if (leaf.underline) children = <u>{children}</u>;
  return <span {...attributes}>{children}</span>;
};
