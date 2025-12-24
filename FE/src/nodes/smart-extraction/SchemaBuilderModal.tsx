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

  return (
    <div
      className="mb-2 relative"
      style={{ marginLeft: level > 0 ? "24px" : "0px" }}
    >
        {/* Connector Line for nested items */}
        {level > 0 && (
            <div className="absolute -left-[24px] top-[18px] w-[24px] h-[1px] bg-slate-200" />
        )}
        {level > 0 && (
            <div className="absolute -left-[24px] -top-2 bottom-[calc(100%-18px)] w-[1px] bg-slate-200" />
        )}

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm hover:border-blue-300 transition-colors">
        {/* Main Row */}
        <div className="flex items-start gap-2 p-3">
          {/* Expand/Collapse */}
          <div className="w-5 flex-shrink-0 pt-2">
            {hasChildren && (
              <button
                onClick={() => toggleExpand(property.id)}
                className="p-0.5 text-slate-400 hover:text-blue-600 rounded transition-colors"
                type="button"
              >
                {property.isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            )}
          </div>

          <div className="flex-grow grid grid-cols-12 gap-3">
             
             {/* Key / Name */}
             <div className="col-span-3">
                 <label className="block text-[10px] font-medium text-slate-400 mb-0.5">Field Key</label>
                 <div className="flex items-center gap-1">
                    <input
                        type="text"
                        placeholder="field_key"
                        value={property.name}
                        onChange={(e) => updateProperty(property.id, "name", e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-sm font-mono focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-slate-700 font-semibold"
                    />
                 </div>
             </div>

             {/* Type */}
             <div className="col-span-2">
                 <label className="block text-[10px] font-medium text-slate-400 mb-0.5">Type</label>
                 <div className="relative">
                    <select
                        value={property.type}
                        onChange={(e) => updateProperty(property.id, "type", e.target.value)}
                        className="w-full pl-7 pr-2 py-1.5 bg-white border border-slate-200 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none text-slate-600 font-medium cursor-pointer"
                    >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="date">Date</option>
                        <option value="money">Money</option>
                        <option value="array">Array</option>
                        <option value="object">Object</option>
                    </select>
                    <div className="absolute left-2 top-1.5 pointer-events-none text-slate-400">
                        {property.type === 'object' ? <Box size={12} /> : 
                         property.type === 'array' ? <List size={12} /> : 
                         property.type === 'number' || property.type === 'money' ? <span className="text-[10px] font-bold">#</span> :
                         <Type size={12} />
                        }
                    </div>
                 </div>
             </div>

             {/* Description & Aliases */}
             <div className="col-span-7 flex flex-col gap-2">
                 <div>
                    <input
                        type="text"
                        placeholder="Description (what to extract) - Keys work best!"
                        value={property.description}
                        onChange={(e) => updateProperty(property.id, "description", e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                 </div>
                 {/* Aliases Input */}
                 {property.type !== 'object' && property.type !== 'array' && (
                     <div className="flex items-center gap-2">
                         <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Aliases:</span>
                         <input
                            type="text"
                            placeholder="e.g. Inv#, InvoiceNo (comma separated)"
                            value={property.aliases.join(', ')}
                            onChange={(e) => updateProperty(property.id, "aliases", e.target.value.split(',').map(s => s.trim()))}
                            className="flex-grow px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] text-slate-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                         />
                     </div>
                 )}
             </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1 pt-4 border-l border-slate-100 pl-2">
             <button
                onClick={() => removeProperty(property.id)}
                type="button"
                className="p-1.5 text-slate-400 rounded hover:bg-red-50 hover:text-red-500 transition-colors"
                title="Delete Field"
             >
                <Trash2 size={14} />
             </button>
             {/* Required Toggle (Optional enhancement) */}
             {/* 
             <button
                onClick={() => updateProperty(property.id, "required", !property.required)}
                type="button"
                className={`p-1.5 rounded transition-colors ${property.required ? 'text-orange-500 bg-orange-50' : 'text-slate-300 hover:text-slate-400'}`}
                title="Mark as Required"
             >
                <Asterisk size={14} />
             </button>
             */}
          </div>

        </div>

        {/* Nested Children */}
        {hasChildren && property.isExpanded && (
          <div className="p-3 pt-0 pl-10 border-t border-slate-50 bg-slate-50/30 rounded-b-lg">
            <div className="pt-3">
              {property.children?.map((child) => (
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
            <button
              onClick={() => addProperty(property.id)}
              className="flex items-center gap-1.5 mt-2 py-1.5 px-3 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors border border-dashed border-blue-200 hover:border-blue-300 w-full justify-center"
              type="button"
            >
              <Plus size={12} />
              Add Nested Property
            </button>
          </div>
        )}
      </div>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-[90vw] max-w-[1000px] h-[90vh] flex flex-col overflow-hidden">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Database className="text-blue-600" size={24} />
                            Schema Builder
                        </h2>
                        <p className="text-sm text-slate-500">Design the structure for data extraction.</p>
                    </div>
                    <div className="flex gap-2">
                         {/* Tab Toggle */}
                        <div className="flex bg-slate-100 p-1 rounded-lg mr-4">
                            <button
                                onClick={() => setActiveTab("visual")}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === "visual" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                            >
                                <div className="flex items-center gap-1.5"><Eye size={14}/> Visual</div>
                            </button>
                            <button
                                onClick={() => setActiveTab("code")}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === "code" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                            >
                                <div className="flex items-center gap-1.5"><Code size={14}/> JSON</div>
                            </button>
                        </div>
                        
                        <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden bg-slate-50">
                    {activeTab === 'visual' ? (
                        <div className="h-full overflow-y-auto p-6">
                            {properties.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-[300px] border-2 border-dashed border-slate-200 rounded-xl bg-white/50">
                                    <div className="p-4 rounded-full bg-slate-100 mb-4">
                                        <Database className="text-slate-400" size={32} />
                                    </div>
                                    <p className="text-slate-500 font-medium mb-4">No fields defined yet</p>
                                    <button 
                                        onClick={() => addProperty()}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm flex items-center gap-2 transition-colors shadow-sm"
                                    >
                                        <Plus size={16} />
                                        Add First Field
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4 pb-20">
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
                                        className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all font-medium text-sm flex items-center justify-center gap-2"
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
                <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-end gap-3 z-10 shrink-0">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-sm transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm font-medium text-sm transition-colors flex items-center gap-2"
                    >
                        <Check size={16} />
                        Save Schema
                    </button>
                </div>

            </div>
        </div>
    );
};
