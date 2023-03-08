

export interface Cluster {
    _id: string,
    owner: string,
    active: boolean,
    created: Date,
    configId: string,
    memberCount: number,
    memberIds: [string],
    generalInformation: {
        name: string,
        shortDescription: string,
        pvp: boolean,
        public: boolean,
        version: string,
        platform: ('STEAM' | 'XBOX' | 'PLAYSTATION'),
        lastWipe: Date,
        nextWipe: Date,
        hostType: ('NITRADO' | 'SELF_HOSTED' | 'OTHER'),
    },
    homepage: {
        title: string,
        logo: string,
        announcements: [{
            id: string,
            date: Date,
            content: string
        }],
        body: string
    }
}

export interface ClusterBuilder {
    name: string;
    pvp: boolean;
    platform: ('STEAM' | 'PLAYSTATION' | 'XBOX');
    hostType: ('NITRADO' | 'SELF_HOSTED' | 'OTHER');
    configId: string;
    description: string;
    public?: boolean;
    lastWipe?: Date;
    nextWipe?: Date;
    body?: String;
    logo?: string;
}