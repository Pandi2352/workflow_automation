import React, { useState, useEffect, memo } from 'react';
import { Plus, Code, Eye, Trash2, ChevronRight, ChevronDown, X, Check, Database, Type, List, Box } from "lucide-react";

// --- Interfaces ---

interface EnumValue {
  id: string;
  value: string;
}

export interface SchemaProperty {
  id: string;
  name: string;
  type: string; // string, number, boolean, array, object
  description: string;
  required: boolean;
  aliases: string[]; // Added for Smart Extraction
  children?: SchemaProperty[];
  isExpanded?: boolean;
  enumValues?: EnumValue[]; // If we want to support enums (maybe later)
}

interface SchemaBuilderModalProps {
  initialSchema: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (schema: any) => void;
}

// --- Helper Components ---

const Tooltip: React.FC<{ content: string; children: React.ReactNode }> = ({ content, children }) => (
    <div className="group relative flex items-center">
        {children}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block px-2 py-1 bg-slate-800 text-white text-[10px] rounded shadow-sm whitespace-nowrap z-50">
            {content}
        </div>
    </div>
);

// --- Property Row Component ---
const PropertyRow = memo(({
  property,
  level = 0,
  updateProperty,
  removeProperty,
  addProperty,
  toggleExpand,
}: {
  property: SchemaProperty;
  level?: number;
  updateProperty: (id: string, field: keyof SchemaProperty, value: any) => void;
  removeProperty: (id: string) => void;
  addProperty: (parentId?: string) => void;
  toggleExpand: (id: string) => void;
}) => {
  const hasChildren = property.type === "object" || property.type === "array";
  const paddingLeft = level * 20;

  return (
    <div className="group border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
        <div className="flex items-center py-1 px-2">
          
          {/* Column 1: Field Key (Tree Structure) */}
          <div className="w-[30%] flex items-center pr-2 relative">
             <div style={{ paddingLeft: `${paddingLeft}px` }} className="flex items-center w-full">
                {/* Connector Lines (Visual Only) */}
                {level > 0 && <div className="absolute left-[8px] border-l border-slate-200 h-full -top-1/2" />}
                
                {/* Expander */}
                <div className="w-5 flex-shrink-0 flex justify-center mr-1">
                    {hasChildren ? (
                        <button
                            onClick={() => toggleExpand(property.id)}
                            className="p-0.5 text-slate-400 hover:text-slate-600 rounded transition-colors"
                        >
                            {property.isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                    ) : (
                        <div className="w-4" />
                    )}
                </div>

                <input
                    type="text"
                    placeholder="key_name"
                    value={property.name}
                    onChange={(e) => updateProperty(property.id, "name", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-100 border-2 border-transparent rounded-lg hover:bg-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-xs font-mono font-semibold text-slate-700 placeholder:text-slate-400 transition-all duration-200"
                />
             </div>
          </div>

          {/* Column 2: Type */}
          <div className="w-[15%] px-2">
              <div className="relative group/type">
                <select
                    value={property.type}
                    onChange={(e) => updateProperty(property.id, "type", e.target.value)}
                    className="w-full pl-6 pr-2 py-1.5 bg-transparent border border-transparent rounded hover:bg-white hover:shadow-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-xs text-slate-700 font-medium appearance-none cursor-pointer transition-all"
                >
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                    <option value="date">Date</option>
                    <option value="money">Money</option>
                    <option value="array">Array</option>
                    <option value="object">Object</option>
                </select>
                <div className="absolute left-1.5 top-1.5 pointer-events-none text-slate-400 group-hover/type:text-slate-600 transition-colors">
                    {property.type === 'object' ? <Box size={12} /> : 
                     property.type === 'array' ? <List size={12} /> : 
                     property.type === 'number' || property.type === 'money' ? <span className="text-[9px] font-bold">#</span> :
                     <Type size={12} />
                    }
                </div>
              </div>
          </div>

          {/* Column 3: Description */}
          <div className="w-[30%] px-2">
            <input
                type="text"
                placeholder="Description of field..."
                value={property.description}
                onChange={(e) => updateProperty(property.id, "description", e.target.value)}
                className="w-full px-3 py-2 bg-slate-100 border-2 border-transparent rounded-lg hover:bg-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-xs text-slate-600 placeholder:text-slate-400 transition-all duration-200"
            />
          </div>

           {/* Column 4: Aliases (Tag Input) */}
          <div className="w-[20%] px-2">
             {property.type !== 'object' && property.type !== 'array' && (
                  <div className="w-full min-h-[34px] px-2 py-1 bg-slate-100 border-2 border-transparent rounded-lg hover:bg-slate-200 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all duration-200 flex flex-wrap items-center gap-1.5 cursor-text" onClick={(e) => {
                      const input = e.currentTarget.querySelector('input');
                      if(input) input.focus();
                  }}>
                      {property.aliases.map((alias, idx) => (
                          <div key={idx} className="flex items-center gap-0.5 px-1.5 py-0.5 bg-white text-slate-700 rounded-md text-[10px] font-medium shadow-sm ring-1 ring-slate-200 animate-in zoom-in-50 duration-200">
                              <span>{alias}</span>
                              <button 
                                  onClick={(e) => {
                                      e.stopPropagation();
                                      const newAliases = property.aliases.filter((_, i) => i !== idx);
                                      updateProperty(property.id, "aliases", newAliases);
                                  }}
                                  className="text-slate-400 hover:text-red-500 rounded-full p-0.5 transition-colors"
                              >
                                  <X size={10} />
                              </button>
                          </div>
                      ))}
                      <input
                        type="text"
                        placeholder={property.aliases.length === 0 ? "add_alias..." : ""}
                        className="flex-1 min-w-[60px] bg-transparent border-none outline-none text-xs text-slate-700 placeholder:text-slate-400 p-0 h-5"
                        onKeyDown={(e) => {
                            const val = e.currentTarget.value.trim();
                            if ((e.key === 'Enter' || e.key === ',') && val) {
                                e.preventDefault();
                                if (!property.aliases.includes(val)) {
                                    updateProperty(property.id, "aliases", [...property.aliases, val]);
                                }
                                e.currentTarget.value = "";
                            } else if (e.key === 'Backspace' && !val && property.aliases.length > 0) {
                                updateProperty(property.id, "aliases", property.aliases.slice(0, -1));
                            }
                        }}
                     />
                  </div>
             )}
          </div>

          {/* Column 5: Actions */}
          <div className="w-[5%] pl-2 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
             {hasChildren && (
                 <button
                    onClick={() => addProperty(property.id)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Add Child"
                 >
                    <Plus size={14} />
                 </button>
             )}
             <button
                onClick={() => removeProperty(property.id)}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                title="Delete"
             >
                <Trash2 size={14} />
             </button>
          </div>

        </div>

        {/* Recursion for Children */}
        {hasChildren && property.isExpanded && property.children && property.children.length > 0 && (
            <div className="border-t border-slate-50">
               {property.children.map((child) => (
                    <PropertyRow
                        key={child.id}
                        property={child}
                        level={level + 1}
                        updateProperty={updateProperty}
                        removeProperty={removeProperty}
                        addProperty={addProperty}
                        toggleExpand={toggleExpand}
                    />
               ))}
            </div>
        )}
    </div>
  );
});


// --- Main Modal Component ---
export const SchemaBuilderModal: React.FC<SchemaBuilderModalProps> = ({
  initialSchema,
  isOpen,
  onClose,
  onSave
}) => {
    const [activeTab, setActiveTab] = useState<"visual" | "code">("visual");
    const [properties, setProperties] = useState<SchemaProperty[]>([]);
    const [codeValue, setCodeValue] = useState("");

    // --- Parser & Generator Logic ---

    // 1. Convert Config Schema -> Property[]
    // Config Schema Format: { [key]: { type, description, aliases, properties?, items? } }
    const parseSchemaToProperties = (schema: any): SchemaProperty[] => {
        if (!schema) return [];
        
        return Object.entries(schema).map(([key, val]: [string, any]) => {
            // Handle simple string format (legacy)
            if (typeof val === 'string') {
                return {
                    id: Math.random().toString(),
                    name: key,
                    type: 'string',
                    description: val,
                    required: false,
                    aliases: [],
                    isExpanded: false
                };
            }

            // Recursive Children Parsing
            let children: SchemaProperty[] | undefined = undefined;
            if (val.type === 'object' && val.properties) {
                children = parseSchemaToProperties(val.properties);
            } else if (val.type === 'array' && val.items && val.items.properties) {
                // Array of Objects
                children = parseSchemaToProperties(val.items.properties);
            }

            return {
                id: Math.random().toString(),
                name: key,
                type: val.type || 'string',
                description: val.description || '',
                required: false, // Default for now
                aliases: val.aliases || [],
                children: children,
                isExpanded: true
            };
        });
    };

    // 2. Convert Property[] -> Config Schema
    const generateSchemaConfig = (props: SchemaProperty[]): any => {
        const schema: any = {};
        
        props.forEach(prop => {
            if (!prop.name) return; // Skip empty keys

            const fieldDef: any = {
                type: prop.type,
                description: prop.description,
                aliases: prop.aliases
            };

            // Recursion
            if (prop.type === 'object' && prop.children) {
                fieldDef.properties = generateSchemaConfig(prop.children);
            } else if (prop.type === 'array') {
                // If array has children, it implies Array<Object>
                if (prop.children && prop.children.length > 0) {
                    fieldDef.items = {
                        type: 'object',
                        properties: generateSchemaConfig(prop.children)
                    };
                } else {
                    // Simple array of strings (default)
                    fieldDef.items = { type: 'string' }; 
                }
            }

            schema[prop.name] = fieldDef;
        });

        return schema;
    };


    // Initialize State
    useEffect(() => {
        if (isOpen) {
            const props = parseSchemaToProperties(initialSchema || {});
            setProperties(props);
            setCodeValue(JSON.stringify(initialSchema || {}, null, 2));
        }
    }, [isOpen, initialSchema]);

    // Sync Code View
    useEffect(() => {
        if (activeTab === 'code') {
            const currentSchema = generateSchemaConfig(properties);
            setCodeValue(JSON.stringify(currentSchema, null, 2));
        }
    }, [activeTab]);


    // CRUD Handlers
    const addProperty = (parentId?: string) => {
        const newProp: SchemaProperty = {
            id: Math.random().toString(),
            name: '',
            type: 'string',
            description: '',
            required: false,
            aliases: [],
            isExpanded: true
        };

        if (!parentId) {
            setProperties(prev => [...prev, newProp]);
        } else {
            const addToDeep = (list: SchemaProperty[]): SchemaProperty[] => {
                return list.map(p => {
                    if (p.id === parentId) {
                        return { ...p, children: [...(p.children || []), newProp] };
                    }
                    if (p.children) {
                        return { ...p, children: addToDeep(p.children) };
                    }
                    return p;
                });
            };
            setProperties(prev => addToDeep(prev));
        }
    };

    const updateProperty = (id: string, field: keyof SchemaProperty, value: any) => {
        const updateDeep = (list: SchemaProperty[]): SchemaProperty[] => {
            return list.map(p => {
                if (p.id === id) {
                    const updated = { ...p, [field]: value };
                    
                    // Logic when changing type
                    if (field === 'type') {
                        if (value === 'object' || value === 'array') {
                            if (!updated.children) updated.children = [];
                        } else {
                             updated.children = undefined;
                        }
                    }
                    return updated;
                }
                if (p.children) return { ...p, children: updateDeep(p.children) };
                return p;
            });
        };
        setProperties(prev => updateDeep(prev));
    };

    const removeProperty = (id: string) => {
        const removeDeep = (list: SchemaProperty[]): SchemaProperty[] => {
             return list.filter(p => p.id !== id).map(p => ({
                 ...p,
                 children: p.children ? removeDeep(p.children) : undefined
             }));
        };
        setProperties(prev => removeDeep(prev));
    };

    const toggleExpand = (id: string) => {
        const toggleDeep = (list: SchemaProperty[]): SchemaProperty[] => {
            return list.map(p => {
                if (p.id === id) return { ...p, isExpanded: !p.isExpanded };
                if (p.children) return { ...p, children: toggleDeep(p.children) };
                return p;
            });
        };
        setProperties(prev => toggleDeep(prev));
    };

    const handleSave = () => {
        const schema = generateSchemaConfig(properties);
        onSave(schema);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-[90vw] max-w-[1000px] h-[85vh] flex flex-col overflow-hidden border border-white/20 ring-1 ring-black/5">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                                <Database size={18} />
                            </div>
                            Schema Builder
                        </h2>
                        {/* <p className="text-xs text-slate-400 mt-0.5 ml-11">Design the extraction structure.</p> */}
                    </div>
                    <div className="flex items-center gap-4">
                         {/* Segmented Control */}
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button
                                onClick={() => setActiveTab("visual")}
                                className={`relative px-4 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 flex items-center gap-1.5 ${
                                    activeTab === "visual" 
                                        ? "bg-white text-slate-800 shadow-sm ring-1 ring-black/5" 
                                        : "text-slate-500 hover:text-slate-700"
                                }`}
                            >
                                <Eye size={14} className={activeTab === "visual" ? "text-blue-500" : ""} />
                                Visual
                            </button>
                            <button
                                onClick={() => setActiveTab("code")}
                                className={`relative px-4 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 flex items-center gap-1.5 ${
                                    activeTab === "code" 
                                        ? "bg-white text-slate-800 shadow-sm ring-1 ring-black/5" 
                                        : "text-slate-500 hover:text-slate-700"
                                }`}
                            >
                                <Code size={14} className={activeTab === "code" ? "text-purple-500" : ""} />
                                JSON
                            </button>
                        </div>
                        
                        <div className="h-6 w-px bg-slate-200" />

                        <button 
                            onClick={onClose} 
                            className="p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden bg-slate-50">
                    {activeTab === 'visual' ? (
                        <div className="h-full overflow-y-auto p-6">
                            {properties.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-[300px] border-2 border-dashed border-slate-200/60 rounded-xl bg-slate-50/50">
                                    <div className="p-4 rounded-full bg-white shadow-sm mb-4 ring-1 ring-slate-100">
                                        <Database className="text-blue-500/50" size={32} />
                                    </div>
                                    <h3 className="text-slate-900 font-semibold mb-1">Start Building Your Schema</h3>
                                    <p className="text-slate-500 text-xs mb-6 max-w-[250px] text-center">Define the fields you want to extract from your documents.</p>
                                    <button 
                                        onClick={() => addProperty()}
                                        className="px-5 py-2.5 bg-white text-blue-600 border border-blue-200 hover:border-blue-300 hover:bg-blue-50 rounded-lg font-medium text-sm flex items-center gap-2 transition-all shadow-sm"
                                    >
                                        <Plus size={16} />
                                        Add First Field
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-0.5 pb-20">
                                    {/* Header Row */}
                                    <div className="flex items-center px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-slate-50/50">
                                        <div className="w-[30%]">Field Key</div>
                                        <div className="w-[15%] px-2">Type</div>
                                        <div className="w-[30%] px-2">Description</div>
                                        <div className="w-[20%] px-2">Aliases</div>
                                        <div className="w-[5%]"></div>
                                    </div>

                                    {properties.map(p => (
                                        <PropertyRow 
                                            key={p.id} 
                                            property={p} 
                                            updateProperty={updateProperty} 
                                            removeProperty={removeProperty}
                                            addProperty={addProperty}
                                            toggleExpand={toggleExpand}
                                        />
                                    ))}
                                    
                                    <button 
                                        onClick={() => addProperty()}
                                        className="w-full py-3 mt-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all font-medium text-sm flex items-center justify-center gap-2"
                                    >
                                        <Plus size={16} />
                                        Add Root Field
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full relative">
                            <textarea 
                                value={codeValue}
                                onChange={(e) => setCodeValue(e.target.value)}
                                className="w-full h-full p-6 font-mono text-sm bg-slate-900 text-green-400 resize-none focus:outline-none"
                                spellCheck={false}
                            />
                            <div className="absolute bottom-6 right-6">
                                <button 
                                    onClick={() => {
                                        try {
                                            const parsed = JSON.parse(codeValue);
                                            setProperties(parseSchemaToProperties(parsed));
                                            // toast.success("Applied JSON changes");
                                            setActiveTab('visual');
                                        } catch(e) {
                                            alert("Invalid JSON");
                                        }
                                    }}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg font-medium text-sm flex items-center gap-2"
                                >
                                    <Check size={16} />
                                    Apply JSON
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-end gap-3 z-10 shrink-0">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-slate-500 hover:bg-slate-50 hover:text-slate-700 rounded-lg font-medium text-sm transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg shadow-md hover:shadow-lg font-medium text-sm transition-all transform active:scale-95 flex items-center gap-2"
                    >
                        <Check size={16} />
                        Save Schema
                    </button>
                </div>

            </div>
        </div>
    );
};
