import { useEditor, EditorContent } from "@tiptap/react";
import { getErrorMessage } from "@/lib/utils";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Youtube from "@tiptap/extension-youtube";
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';

import { uploadImage } from "../../lib/supabase";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Link as LinkIcon,
  Image as ImageIcon,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Quote,
  Undo,
  Redo,
  Youtube as YTIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  Palette
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "../shared/ToastProvider";

function ToolBtn({ onClick, active, title, children, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`p-2 rounded-lg text-sm transition-all disabled:opacity-30 ${
        active
          ? "bg-purple-600 text-white shadow-lg"
          : "hover:bg-white/10 text-white/60 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

export default function RichEditor({ content = "", onChange }) {
  const [uploading, setUploading] = useState(false);
  const toast = useToast();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        allowBase64: false,
        HTMLAttributes: { class: "rounded-xl max-w-full" },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-purple-400 underline" },
      }),
      Youtube.configure({
        width: 640,
        height: 360,
        HTMLAttributes: { class: "rounded-xl w-full aspect-video" },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content,
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false);
    }
  }, [content, editor]);

  if (!editor) return null;

  async function handleImageUpload() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      setUploading(true);
      try {
        const url = await uploadImage(file, "covers");
        editor.chain().focus().setImage({ src: url, alt: file.name }).run();
      } catch (err) {
        toast.error(getErrorMessage(err, "فشل رفع الصورة"));
      } finally {
        setUploading(false);
      }
    };
    input.click();
  }

  function setLink() {
    const prev = editor.getAttributes("link").href;
    const url = window.prompt("أدخل رابط URL:", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }

  function addYoutube() {
    const url = window.prompt("أدخل رابط يوتيوب:");
    if (url) editor.chain().focus().setYoutubeVideo({ src: url }).run();
  }

  const divider = <div className="w-px h-5 bg-white/10 mx-1" />;

  return (
    <div className="border border-white/10 rounded-2xl overflow-hidden focus-within:border-purple-500/50 transition-all bg-[#050505]">
      {/* شريط الأدوات */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-white/5 bg-[#0d0d0d]">
        <ToolBtn
          onClick={() => editor.chain().focus().undo().run()}
          title="تراجع (Ctrl+Z)"
          disabled={!editor.can().undo()}
        >
          <Undo size={16} />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().redo().run()}
          title="إعادة (Ctrl+Y)"
          disabled={!editor.can().redo()}
        >
          <Redo size={16} />
        </ToolBtn>
        {divider}
        <ToolBtn
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="غامق (Ctrl+B)"
        >
          <Bold size={16} />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="مائل (Ctrl+I)"
        >
          <Italic size={16} />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          title="خط أسفل النص (Ctrl+U)"
        >
          <UnderlineIcon size={16} />
        </ToolBtn>
        
        {/* Color and Highlight Pickers */}
        {divider}
        <div className="relative flex items-center mx-1 group" title="لون النص">
          <Palette size={16} className="absolute right-1.5 pointer-events-none text-white/60 group-hover:text-white transition-colors" />
          <input
            type="color"
            onInput={event => editor.chain().focus().setColor(event.target.value).run()}
            value={editor.getAttributes('textStyle').color || '#ffffff'}
            className="w-7 h-7 opacity-0 cursor-pointer"
          />
        </div>
        <div className="relative flex items-center mx-1 group" title="تمييز النص (Highlight)">
          <Highlighter size={16} className="absolute right-1.5 pointer-events-none text-white/60 group-hover:text-white transition-colors" />
          <input
            type="color"
            onInput={event => editor.chain().focus().toggleHighlight({ color: event.target.value }).run()}
            value={editor.getAttributes('highlight').color || '#ffcc00'}
            className="w-7 h-7 opacity-0 cursor-pointer"
          />
        </div>
        {divider}

        <ToolBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          title="عنوان H2"
        >
          <Heading2 size={16} />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
          title="عنوان H3"
        >
          <Heading3 size={16} />
        </ToolBtn>
        {divider}
        <ToolBtn
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          active={editor.isActive({ textAlign: 'right' })}
          title="محاذاة لليمين"
        >
          <AlignRight size={16} />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          active={editor.isActive({ textAlign: 'center' })}
          title="توسيط"
        >
          <AlignCenter size={16} />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          active={editor.isActive({ textAlign: 'left' })}
          title="محاذاة لليسار"
        >
          <AlignLeft size={16} />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          active={editor.isActive({ textAlign: 'justify' })}
          title="ضبط (Justify)"
        >
          <AlignJustify size={16} />
        </ToolBtn>
        {divider}

        <ToolBtn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="قائمة نقطية"
        >
          <List size={16} />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="قائمة مرقّمة"
        >
          <ListOrdered size={16} />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="اقتباس"
        >
          <Quote size={16} />
        </ToolBtn>
        {divider}
        <ToolBtn
          onClick={setLink}
          active={editor.isActive("link")}
          title="رابط"
        >
          <LinkIcon size={16} />
        </ToolBtn>
        <ToolBtn
          onClick={handleImageUpload}
          title="رفع صورة"
          disabled={uploading}
        >
          <ImageIcon size={16} />
        </ToolBtn>
        <ToolBtn onClick={addYoutube} title="فيديو يوتيوب">
          <YTIcon size={16} />
        </ToolBtn>
        {uploading && (
          <span className="text-[10px] text-white/40 mr-2 font-black uppercase">
            جارٍ الرفع...
          </span>
        )}
      </div>

      {/* منطقة الكتابة */}
      <EditorContent
        editor={editor}
        className="prose prose-invert prose-purple max-w-none p-8 min-h-[400px] focus-within:outline-none text-white text-xl leading-relaxed"
      />
    </div>
  );
}
