package com{
    import es.core.Skin;
    import es.core.Container;
    import es.components.SkinComponent;
    import es.interfaces.IContainer;
    import SelectionSkin;

    [Skin("com.SelectionSkin")]
    public class Selection extends SkinComponent
    {
        public function Selection( componentId:String = UIDInstance() )
        {
            super( componentId );
        }

        /**
         * @private
         */
        private var _dataSource:Array = [];

        /**
         * 获取数据源对象
         * @returns {DataSource}
         */
        public function get dataSource():Array
        {
            return _dataSource;
        };

        public function set dataSource( data:Array ):void
        {
            _dataSource = data;
        };

        // 当前被选中的元素ID
        private var _current:* = 0;

        /**
         * 获取当前被选中的元素ID
         */
        public function get current():*
        {
            return this._current;
        }

        /**
         * 设置选中一个元素
         * @param value
         */
        public function set current(value:*):void
        {
            this._current = value;
        }

        /**
         * 获取弹框的容器
         * @return Skin
         */
        public function getContainer():Skin
        {
            return (this.skin as SelectionSkin).selection;
        }

        /**
         * 提交数据并且立即更新视图
         */
        override protected function commitPropertyAndUpdateSkin()
        {
            var skin:Skin = this.getContainer();
            skin.variable('current', current);
            skin.variable('optionitems', dataSource );
            super.commitPropertyAndUpdateSkin();
        }
    }
}