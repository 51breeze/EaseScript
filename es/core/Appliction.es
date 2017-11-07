package es.core
{
   import es.components.SkinComponent;
   import es.core.Container;
   import es.skins.ApplictionSkin;
   import es.core.es_internal;

   public class Appliction extends SkinComponent
   {
       public function Appliction()
       {
           super();
           Element( document ).addEventListener(Event.READY,function (e:Event) {

               this._viewport = new Container( new Element(document.documentElement) );
               this.display();

           },false,0,this);
       }

       override protected function skinInstaller()
       {
           this.skin.es_internal::skinInstaller();
       }

       public function get document()
       {
           return document;
       }

       public function get window()
       {
           return window;
       }

       public function render()
       {
           this.display();
           return document.documentElement.outerHTML;
       }

       private var _viewport=null;
       override public function get viewport():Container
       {
          return _viewport;
       };

       /**
        * 获取皮肤类
        * @returns Class
        */
       override public function get skinClass():Class
       {
           var value=super.skinClass;
           if( value===null )return ApplictionSkin;
           return value;
       }

       /**
        * 设置此组件在指定的视口中
        * @param Object obj
        * @returns {void}
        */
       override public function set viewport(obj:Container):void
       {
           throw new TypeError('can not set viewport of appliction' );
       };
   }
}