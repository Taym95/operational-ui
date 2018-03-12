
          window.__NEXT_REGISTER_PAGE('/components/records', function() {
            var comp = module.exports=webpackJsonp([35],{1243:function(e,n,t){e.exports=t(1244)},1244:function(e,n,t){"use strict";function a(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(n,"__esModule",{value:!0});var o=t(0),l=function(e){if(e&&e.__esModule)return e;var n={};if(null!=e)for(var t in e)Object.prototype.hasOwnProperty.call(e,t)&&(n[t]=e[t]);return n.default=e,n}(o),d=t(9),r=t(213),c=a(r),i=t(212),p=a(i),u=t(12),s=a(u),f=[{name:"children",description:"Children, typically a single <RecordHeader/> element and a single optional <RecordBody/> element.",defaultValue:"",type:"React.ReactElement",optional:!0},{name:"initiallyExpanded",description:"Specifies the expanded state the component should start in (whether RecordBody should show).",defaultValue:"",type:"React.ReactElement",optional:!0},{name:"controls",description:"Replaces the standard expand button with a custom set of controls.",defaultValue:"",type:"React.ReactElement",optional:!0}];n.default=function(e){return l.createElement(s.default,{pathname:e.url.pathname},l.createElement(d.Card,null,l.createElement("p",null,"Records are general-purpose displays of resources, composed of a header element and a body that can be expanded and hidden from a standardized button on the top right."),l.createElement(d.Heading2Type,null,"Usage"),l.createElement(p.default,{snippet:'\n<Record>\n  <RecordHeader>\n    Deutsche Bahn (German Railway Company)\n  </RecordHeader>\n  <RecordBody>\n    <InfoTile label="Founded">1994</InfoTile>\n    <InfoTile label="Employees">~300,000</InfoTile>\n    <InfoTile label="Annual Revenue">A lot!</InfoTile>\n  </RecordBody>\n</Record>\n',components:{Record:d.Record},scope:{RecordHeader:d.RecordHeader,RecordBody:d.RecordBody,Heading1Type:d.Heading1Type,InfoTile:d.InfoTile}}),l.createElement(d.Heading2Type,null,"Props"),l.createElement(c.default,{props:f})))}}},[1243]);
            return { page: comp.default }
          })
        