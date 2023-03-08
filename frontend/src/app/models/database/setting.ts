
export interface Property {
    key: string;
    value: any;
    category: string;
    label: string;
    type: ('Number' | 'Boolean' | 'String' | 'Object');
    description: string;
}