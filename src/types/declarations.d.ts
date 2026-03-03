// Type declarations for modules without types

declare module 'react-icons/bs' {
  import { IconType } from 'react-icons';
  export const BsMicrosoft: IconType;
  export const BsGoogle: IconType;
  export const BsFacebook: IconType;
  export const BsApple: IconType;
  export const BsGithub: IconType;
  export const BsTwitter: IconType;
  export const BsLinkedin: IconType;
  export const BsInstagram: IconType;
  export const BsYoutube: IconType;
}

declare module 'react-icons/fa' {
  import { IconType } from 'react-icons';
  export const FaHome: IconType;
  export const FaSearch: IconType;
  export const FaCompass: IconType;
  export const FaHeart: IconType;
  export const FaUser: IconType;
  export const FaBell: IconType;
  export const FaPlusSquare: IconType;
  export const FaRegHeart: IconType;
  export const FaRegComment: IconType;
  export const FaRegBookmark: IconType;
  export const FaBookmark: IconType;
  export const FaRegPaperPlane: IconType;
  export const FaEllipsisH: IconType;
  export const FaSignOutAlt: IconType;
  export const FaCog: IconType;
  export const FaBars: IconType;
  export const FaTimes: IconType;
  export const FaCamera: IconType;
  export const FaCloudUploadAlt: IconType;
  export const FaPlay: IconType;
  export const FaPause: IconType;
  export const FaVolumeMute: IconType;
  export const FaVolumeUp: IconType;
  export const FaShare: IconType;
  export const FaFlag: IconType;
  export const FaTrash: IconType;
  export const FaEdit: IconType;
  export const FaStar: IconType;
  export const FaReply: IconType;
  export const FaThumbsUp: IconType;
  export const FaThumbsDown: IconType;
  export const FaCheck: IconType;
  export const FaArchive: IconType;
  export const FaUserFriends: IconType;
  export const FaLock: IconType;
  export const FaUnlock: IconType;
  export const FaMoon: IconType;
  export const FaSun: IconType;
  export const FaPalette: IconType;
  export const FaGlobe: IconType;
  export const FaShieldAlt: IconType;
  export const FaInfoCircle: IconType;
  export const FaChevronRight: IconType;
  export const FaChevronDown: IconType;
  export const FaChevronLeft: IconType;
  export const FaRegImage: IconType;
  export const FaLink: IconType;
  export const FaCode: IconType;
  export const FaSmile: IconType;
  export const FaFilter: IconType;
  export const FaBriefcase: IconType;
  export const FaGraduationCap: IconType;
  export const FaBuilding: IconType;
  export const FaMapMarkerAlt: IconType;
  export const FaCalendarAlt: IconType;
  export const FaClock: IconType;
  export const FaMoneyBillWave: IconType;
  export const FaExternalLinkAlt: IconType;
  export const FaDownload: IconType;
  export const FaUpload: IconType;
  export const FaExpand: IconType;
  export const FaCompress: IconType;
  export const FaCircle: IconType;
  export const FaEnvelope: IconType;
  export const FaPlus: IconType;
  export const FaVideo: IconType;
  export const FaCommentDots: IconType;
  export const FaStore: IconType;
  export const FaUniversity: IconType;
  export const FaUserPlus: IconType;
  export const FaUserMinus: IconType;
  export const FaUserShield: IconType;
  export const FaQuestionCircle: IconType;
  export const FaHistory: IconType;
  export const FaQrcode: IconType;
  export const FaUsers: IconType;
  export const FaComment: IconType;
  export const FaArrowLeft: IconType;
  export const FaImage: IconType;
  export const FaUndo: IconType;
}

declare module 'socket.io' {
  export class Server {
    constructor(httpServer?: any, opts?: any);
    on(event: string, listener: (...args: any[]) => void): this;
    emit(event: string, ...args: any[]): boolean;
    of(namespace: string): any;
  }
}

declare module '@azure/msal-browser' {
  export interface Configuration {
    auth: {
      clientId: string;
      authority?: string;
      redirectUri?: string;
    };
    cache?: {
      cacheLocation?: string;
      storeAuthStateInCookie?: boolean;
    };
  }
  export class PublicClientApplication {
    constructor(config: Configuration);
    initialize(): Promise<void>;
    loginPopup(request?: any): Promise<any>;
    loginRedirect(request?: any): Promise<void>;
    acquireTokenSilent(request: any): Promise<any>;
    acquireTokenPopup(request: any): Promise<any>;
    getActiveAccount(): any;
    setActiveAccount(account: any): void;
    getAllAccounts(): any[];
    handleRedirectPromise(): Promise<any>;
  }
  export interface AccountInfo {
    homeAccountId: string;
    environment: string;
    tenantId: string;
    username: string;
    localAccountId: string;
    name?: string;
    idTokenClaims?: Record<string, unknown>;
  }
}

declare module 'google-auth-library' {
  export class OAuth2Client {
    constructor(clientId?: string, clientSecret?: string, redirectUri?: string);
    verifyIdToken(options: { idToken: string; audience: string }): Promise<any>;
  }
}
